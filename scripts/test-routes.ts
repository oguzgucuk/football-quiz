async function testRoutes() {
  const routes = ["/", "/profile", "/store", "/settings"];
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:5000${r}`);
      console.log(`${r} -> HTTP ${res.status}`);
    } catch (err: any) {
      console.error(`${r} -> ERROR:`, err.message);
    }
  }
}
testRoutes();
