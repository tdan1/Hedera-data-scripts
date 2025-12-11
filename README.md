DexPay Verification Toolkit
Subject: Re: Milestone Verification - Independent Audit Scripts

Hi Team,

Thank you for the specific feedback regarding the repeating "From/To" addresses. You are absolutely correct—because DexPay operates on an Escrow Model, the top-level explorer view shows our Contract (0.0.9392720) as the counterparty in 100% of transactions. This effectively "hides" the unique users from a quick glance.


To resolve this, we have provided two simple scripts that allow you to generate our contract calls using the hedera API and mathematically prove the 4,920 Unique Users by filtering out the Escrow contract and siolating unique wallets.

(Note: We have added detailed comments inside the code itself to explain every step of the logic for your technical team.)

Below is a simple guide to running these scripts on your local machine.

🛠️ Step 0: Prerequisites
You need Node.js to run these scripts.

Open your terminal (Mac/Linux) or Command Prompt (Windows) and type:

```Bash

node -v
```
If you see a version number (e.g., v18.x.x), you are ready!


If you see an error, download and install the "LTS" version here: nodejs.org

📂 Step 1: Setup
Create a new folder on your desktop called dexpay_verify.

Save the two attached code files into that folder:

Save the first code block as 1_fetch_data.js

Save the second code block as 2_analyze_users.js

(Note: We have added detailed comments inside the code itself to explain every step of the logic for your technical team.)

🚀 Step 2: Run the Verification
Open your terminal/command prompt, navigate to your new folder, and run the commands below.

1. Run the Data Collector This script queries the official Hedera Mirror Node API to download the complete, immutable history of our contract for 2025. It creates a "Source of Truth" file locally.

```Bash

cd Desktop/dexpay_verify
node 1_fetch_data.js
```
Wait for it to say "✅ SUCCESS! Saved to: ( dexpay_contract_calls_2025.json )"

2. Run the Analyzer This script reads the file you just downloaded. It filters out our Contract Address (0.0.9392720) and counts the remaining addresses (the Unique Users).

```Bash

node 2_analyze_users.js
```
📊 What You Will See (The Evidence)
The second script will output a final report resembling this:



============================================================
📊 INDEPENDENT VERIFICATION RESULTS
============================================================
👥 Total Unique Wallets: 4,920
📥 Total Inbound Calls:  10,704
📤 Total Outbound Txns:  9,834
📅 Data Period:          2025
============================================================
It will also generate a file named (unique_wallets_2025.json) containing the full list of 4,920 wallet IDs for your review.

We believe this programmatic approach provides the most robust proof of user activity, as it allows your team to verify the logic directly rather than relying on our summary.

Best regards,

DexPay Team
