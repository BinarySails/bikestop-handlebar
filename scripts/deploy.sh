#!/usr/bin/env bash

export ENVIRONMENT=production

bun run orval:generate
bun run build
