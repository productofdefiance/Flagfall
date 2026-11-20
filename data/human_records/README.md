# The Editor's own games

Put a match here when you want it compared with the lab's games (Brief 016). One file per match.

1. On the board, open **Matches**, pick the match, and press **Copy match record for Claude**.
2. Make a new file in this folder named after the match id (for example `m1abc2de.json`) and paste the record into it.
3. Ask Code to run `node sims/lab/record.js data/human_records/*.json --out <file.csv>`. Each match becomes one row with the same columns as a lab game, stall columns included.

A record whose moves don't replay to the result it saved is skipped and named, never guessed.
