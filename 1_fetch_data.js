const fs = require('fs');

// ==============================================================================
// CONFIGURATION & TARGETS
// ==============================================================================
// The DexPay Escrow Contract ID on Hedera Mainnet
const CONTRACT_ID = "0.0.9392720";
// The EVM address equivalent, used for filtering specific log topics if needed
const CONTRACT_EVM_ADDRESS = "0x00000000000000000000000000000000008f5690";

// REPORTING PERIOD CONFIGURATION
// We are capturing data strictly from October 1st, 2025 to December 1st, 2025.
// Timestamps are converted to seconds to match Hedera API requirements.
const DATE_START = Math.floor(new Date('2025-10-01T00:00:00Z').getTime() / 1000);
const DATE_END = Math.floor(new Date('2025-12-01T00:00:00Z').getTime() / 1000);

// SOURCE OF TRUTH
// We use the official Hedera Mainnet Public Mirror Node for verifiable, immutable data.
const MIRROR_NODE_BASE = "https://mainnet-public.mirrornode.hedera.com/api/v1";

/**
 * HELPER: Sleep function
 * Used to enforce rate limiting so we don't overwhelm the public API
 * during deep data scrapes.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * PHASE 1: FETCH INBOUND ACTIVITY
 * This function retrieves "Contract Results".
 * context: These represent users initiating calls TO the DexPay contract
 * (e.g., Depositing Fiat/Stablecoins).
 */
async function fetchContractResults() {
  console.log("\n📥 Fetching contract results (calls TO contract)...");
  let allResults = [];
  
  // Construct API Query:
  // - Filter by Contract ID
  // - Filter by Date Range (gte: Start, lt: End)
  // - Order Ascending to get chronological history
  let url = `${MIRROR_NODE_BASE}/contracts/${CONTRACT_ID}/results?timestamp=gte:${DATE_START}&timestamp=lt:${DATE_END}&limit=100&order=asc`;
  
  let pageCount = 0;
  
  // PAGINATION LOOP
  // The API returns pages of 100 records. This loop follows the 'next' link
  // until all historical data is retrieved.
  while (url) {
    pageCount++;
    process.stdout.write(`\r  Fetching page ${pageCount}... (${allResults.length} results so far)`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`\n  ❌ HTTP error! status: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      // Check if we got any results
      if (!data.results || data.results.length === 0) {
        console.log(`\n  ℹ️  No more results`);
        break;
      }
      
      // Accumulate results into our main array
      allResults.push(...data.results);
      
      // CHECK FOR NEXT PAGE
      // If the API provides a "next" link, update the URL to fetch the next batch.
      if (data.links?.next) {
        const nextLink = data.links.next;
        url = nextLink.startsWith('http') 
          ? nextLink 
          : `https://mainnet-public.mirrornode.hedera.com${nextLink}`;
        
        // Debug: Show next URL occasionally
        if (pageCount % 10 === 0) {
          console.log(`\n  📍 Next URL: ${url}`);
        }
      } else {
        console.log(`\n  ℹ️  No more pages (no next link)`);
        url = null;
      }
      
      // Rate limiting - be more gentle
      await sleep(200);
    } catch (error) {
      console.error(`\n  ❌ Error fetching page ${pageCount}:`, error.message);
      break;
    }
  }
  
  console.log(`\n  ✅ Found ${allResults.length} contract results`);
  return allResults;
}

/**
 * PHASE 2: FETCH OUTBOUND ACTIVITY
 * This function retrieves "Transactions".
 * Context: These represent the contract sending funds/tokens OUT to users
 * (e.g., Releasing Escrow funds to a user's wallet).
 */
async function fetchTransactionsFromContract() {
  console.log("\n📤 Fetching transactions (FROM contract to users)...");
  let allTransactions = [];
  
  // Construct API Query:
  // - Filter where account.id is the Contract (Sender)
  // - Filter by the same Date Range
  let url = `${MIRROR_NODE_BASE}/transactions?account.id=${CONTRACT_ID}&timestamp=gte:${DATE_START}&timestamp=lt:${DATE_END}&limit=100&order=asc`;
  
  let pageCount = 0;
  
  // PAGINATION LOOP (Same logic as Phase 1)
  while (url) {
    pageCount++;
    process.stdout.write(`\r  Fetching page ${pageCount}... (${allTransactions.length} transactions so far)`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`\n  ❌ HTTP error! status: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      // Check if we got any results
      if (!data.transactions || data.transactions.length === 0) {
        console.log(`\n  ℹ️  No more results`);
        break;
      }
      
      allTransactions.push(...data.transactions);
      
      // Check for next page - use the full link from the API
      if (data.links?.next) {
        const nextLink = data.links.next;
        url = nextLink.startsWith('http') 
          ? nextLink 
          : `https://mainnet-public.mirrornode.hedera.com${nextLink}`;
        
        // Debug: Show next URL occasionally
        if (pageCount % 10 === 0) {
          console.log(`\n  📍 Next URL: ${url}`);
        }
      } else {
        console.log(`\n  ℹ️  No more pages (no next link)`);
        url = null;
      }
      
      // Rate limiting - be more gentle
      await sleep(200);
    } catch (error) {
      console.error(`\n  ❌ Error fetching page ${pageCount}:`, error.message);
      break;
    }
  }
  
  console.log(`\n  ✅ Found ${allTransactions.length} transactions`);
  return allTransactions;
}

/**
 * MAIN EXECUTION
 * Orchestrates the data fetching, aggregation, and file saving.
 */
async function main() {
  console.log("=".repeat(60));
  console.log("🚀 DexPay Contract Data Fetcher -  2025");
  console.log("=".repeat(60));
  console.log(`Contract ID: ${CONTRACT_ID}`);
  console.log(`Period: October 1 TO DEC 1, 2025`);
  console.log("=".repeat(60));
  
  try {
    // 1. EXECUTE DATA COLLECTION
    // Fetch both Inbound (Results) and Outbound (Transactions) sequentially
    const contractResults = await fetchContractResults();
    const transactions = await fetchTransactionsFromContract();
    
    // 2. DATA AGGREGATION
    // Structure the data with clear metadata for the reviewers
    const allData = {
      metadata: {
        contractId: CONTRACT_ID,
        contractEvmAddress: CONTRACT_EVM_ADDRESS,
        period: "2025",
        startTimestamp: DATE_START,
        endTimestamp: DATE_END,
        fetchedAt: new Date().toISOString(),
        totalContractResults: contractResults.length,
        totalTransactions: transactions.length
      },
      contractResults: contractResults,
      transactions: transactions
    };
    
    // 3. SAVE TO FILE
    // Write the raw, unadulterated data to a JSON file for independent audit
    const filename = `dexpay_contract_calls_2025.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ SUCCESS!");
    console.log("=".repeat(60));
    console.log(`📄 Saved to: ${filename}`);
    console.log(`📊 Total contract results (TO contract): ${contractResults.length}`);
    console.log(`📊 Total transactions (FROM contract): ${transactions.length}`);
    console.log(`💾 File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
    console.log("=".repeat(60));
    
    
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();