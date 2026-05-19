Task ID: 1
Agent: Main
Task: Implement (1) Unique ending amount per campaign for transfer verification, and (2) Proposal acceptance criteria for crowdsourcing

Work Log:

Added uniqueCode (Int, default 0) field to Campaign model in Prisma schema
Added 5 proposal criteria score fields (kejelasanTujuan, kelayakanAnggaran, urgensi, keterkaitanKampus, kontribusiSosial) to Proposal model
Updated seed.ts with unique codes per campaign (10, 25, 33, 41, 57, 68, 79, 83, 96) and criteria scores per proposal
Reset database, pushed schema, and re-seeded data
Updated types.ts: Campaign interface now includes uniqueCode: number, Proposal interface includes criteria fields
Added helper functions: formatUniqueCode(), calculateTransferAmount(), PROPOSAL_CRITERIA constant, getCriteriaScoreColor(), getAverageCriteria(), isProposalEligible()
Updated donation-modal.tsx: Shows unique code info box in step 2 (only for transfer method), shows code and total transfer in step 3 summary
Updated donatur-dashboard.tsx: Added unique code badges on campaign cards, added "Kode Unik" column in donation history table
Updated admin-dashboard.tsx: Added "Kode Unik" and "Akhir 3 Digit" columns in donation verification table (with green highlight for matching codes), added "Kriteria Penilaian" section in proposal detail view with all 5 criteria progress bars and eligibility status
Server verified working: API returns uniqueCode and criteria data correctly, login works, page loads with 200
Stage Summary:

Feature 1 (Unique Code Transfer): Each campaign has a unique 3-digit code. When donatur selects transfer method, they see the code and are told to add it to their transfer amount. Admin sees "Akhir 3 Digit" column that auto-highlights matching codes in green.
Feature 2 (Proposal Criteria): 5 acceptance criteria with scores 0-100. Average >= 70 means "MEMENUHI SYARAT". Displayed as progress bars in admin proposal detail. Criteria: Kejelasan Tujuan, Kelayakan Anggaran, Urgensi, Keterkaitan Kampus, Kontribusi Sosial.