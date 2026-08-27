import { useNavigate } from "@tanstack/react-router";
import {
  ArchiveIcon,
  EyeIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateUserRequest } from "@/lib/api/api";
import type { UserWithRolesResponse } from "@/lib/api/schemas";

type UserActionsMenuProps = {
  user: UserWithRolesResponse;
  archived: boolean;
  onUpdated: () => void;
};

export function UserActionsMenu({
  user,
  archived,
  onUpdated,
}: UserActionsMenuProps) {
  const navigate = useNavigate();
  const { trigger, isMutating } = useUpdateUserRequest(user.id);

  async function changeArchiveStatus() {
    const result = await trigger({ status: archived ? "enable" : "disable" });
    if (result.status === 200) {
      toast.success(archived ? "Usuario reactivado." : "Usuario archivado.");
      onUpdated();
      return;
    }
    toast.error("No fue posible actualizar el usuario.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Acciones de ${user.username}`}
          />
        }
      >
        <MoreVerticalIcon className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: "/admin/users/$userId",
              params: { userId: user.id },
              search: { roles: user.roles.map((role) => role.id) },
            })
          }
        >
          <EyeIcon /> Ver
        </DropdownMenuItem>
        <DropdownMenuItem
          variant={archived ? "default" : "destructive"}
          disabled={isMutating}
          onClick={changeArchiveStatus}
        >
          {archived ? <RotateCcwIcon /> : <ArchiveIcon />}
          {archived ? "Reactivar" : "Archivar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
