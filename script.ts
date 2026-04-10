import { scrapeWizzhq } from "./lib/scrapers";

scrapeWizzhq().then((results) => {
  console.log("Total campaigns:", results.length);

  if (results.length > 0) {
    console.log("\nFirst campaign:");
    console.log(JSON.stringify(results[0], null, 2));

    console.log("\nAll titles:");
    results.forEach((r, i) =>
      console.log(
        `  ${i + 1}. ${r.title} | ${r.protocol_name} | $${r.reward_usd} | ${r.entry_count} entries`,
      ),
    );
  } else {
    console.log("No campaigns found — check selector output above for errors.");
  }
});
