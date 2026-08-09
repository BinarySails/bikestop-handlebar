#!/usr/bin/env bash

ENVIRONMENT=production

bun run orval:generate
bun run build
