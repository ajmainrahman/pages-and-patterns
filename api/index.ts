export default (_req: unknown, res: { json: (data: unknown) => void }) => {
  res.json({ message: "Static site - no API" });
};
