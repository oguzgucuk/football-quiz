import assert from "node:assert/strict";
import type * as Party from "partykit/server";
import AuctionPartyServer from "../party/auction";
import { createInitialAuctionState } from "../lib/auction/auctionRoomEngine";
import { AuctionRoomState } from "../lib/auction/auctionTypes";

async function main() {
  let saved = createInitialAuctionState("auction_test", "host", "Host");
  saved.status = "simulation";
  saved.currentRoundMinute = 20;
  saved.simulationStartedAt = Date.now() - 20_000;
  const messages: string[] = [];
  const conn = { id: "conn", send: (msg: string) => messages.push(msg) } as Party.Connection;
  const room = {
    id: "auction_test",
    storage: {
      get: async () => structuredClone(saved),
      put: async (_key: string, value: AuctionRoomState) => { saved = structuredClone(value); },
    },
    getConnections: () => [conn],
    broadcast: (msg: string) => messages.push(msg),
  } as unknown as Party.Room;
  const server = new AuctionPartyServer(room);
  await server.onStart();
  try {
    assert.equal(server.state.status, "simulation");
    assert.ok(server.state.currentRoundMinute >= 20 && server.state.currentRoundMinute < 22);
    await server.onMessage(JSON.stringify({ type: "AUCTION_JOIN", userId: "host", username: "Host" }), conn);
    await server.onMessage(JSON.stringify({ type: "AUCTION_ROUND_COMPLETE", userId: "host" }), conn);
    assert.ok(server.state.currentRoundMinute < 90, "Client must not fast-forward a match");
    await server.onMessage(JSON.stringify({ type: "AUCTION_NEXT_SIM_MATCH", userId: "someone-else" }), conn);
    assert.equal(JSON.parse(messages.at(-1)!).type, "AUCTION_ERROR");
    server.onClose(conn);
    assert.equal(server.state.participants.host.isDisconnected, true);
    assert.equal(server.disconnectGraceTimers.size, 1);
    await server.onMessage(JSON.stringify({ type: "AUCTION_JOIN", userId: "host", username: "Host" }), conn);
    assert.equal(server.disconnectGraceTimers.size, 0);
    assert.equal(server.state.participants.host.isDisconnected, false);
    assert.equal(saved.status, "simulation");
    console.log("✓ Cloud restore, reconnect grace, identity and early-finish guards passed");
  } finally {
    clearInterval(server.timerInterval);
    for (const timer of server.disconnectGraceTimers.values()) clearTimeout(timer);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
