const Octokit = require("@octokit/rest");
const octokit = Octokit({
    auth: process.env.GITHUB_TOKEN
});

const owner = "Godin";
const repo = "mq-test";

(async () => {
    const r = await octokit.rateLimit.get()
    console.log("remaining rate: " + r.data.rate.remaining)

    const { data: pulls } = await octokit.pulls.list({
        owner: owner,
        repo: repo,
        state: "open",
        per_page: 100, // max
    })
    //console.log(JSON.stringify(result.headers, null, 2))
    //console.log("rate remaining: " + result.headers["x-ratelimit-remaining"])

    console.log("Merge queue:")
    const pull_number = pulls
        .filter((pr) => {
            return pr.labels.filter((label) => {
                return label.name == "mq"
            }).length == 1
        })
        .map((pr) => {
            console.log(pr.html_url)
            return pr.number
        })
        .splice(0, 1)[0]

    if (!pull_number) {
        console.log("empty")
        return
    }

    console.log("Processing " + pull_number)
    const { data: pr } = await octokit.pulls.get({
        owner: owner,
        repo: repo,
        pull_number: pull_number
    })
    console.log("mergeable: " + pr.mergeable)
    console.log("mergeable_state: " + pr.mergeable_state)
    switch (pr.mergeable_state) {
    case "behind":
        await octokit.repos.merge({
            owner: owner,
            repo: repo,
            base: pr.head.ref,
            head: "master",
            commit_message: "update from master",
        })
        break
    case "clean":
        await octokit.pulls.merge({
            owner: owner,
            repo: repo,
            pull_number: pull_number,
            merge_method: "rebase",
        })
        break
    case "blocked":
        // wait for required checks to pass
        break
    case "unstable":
        // checks failed
    case "dirty":
        // conflicts should be resolved
        await octokit.issues.removeLabel({
            owner: owner,
            repo: repo,
            issue_number: pull_number,
            name: "mq"
        })
        break
    default:
        console.error("unknown mergeable_state")
        break
    }
})()
