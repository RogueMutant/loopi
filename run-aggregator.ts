import { runAggregator } from "./lib/aggregator";

console.log("Starting aggregator workflow via GitHub Actions...");

runAggregator()
  .then((result) => {
    console.log("Aggregator finished successfully:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Aggregator failed:", err);
    process.exit(1);
  });
