export function parseAddr(addr: string) {
  const match = /^(?<hostname>\w+)?(?<port>(?<!:):\d+)?$/.exec(addr);
  if (match) {
    return {
      hostname: match.groups?.hostname?.replace(/^\[|\]$/g, ""),
      port: match.groups?.port?.replace(/^:/g, ""),
    };
  }
}
