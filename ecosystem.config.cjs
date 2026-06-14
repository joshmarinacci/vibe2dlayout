module.exports = {
  apps : [{
    name   : "draw-limn",
    script : "npm",
    args: "run dev",
  }],
  deploy: {
    production: {
      user: "deployman",
      key: '../deployman_private.key',
      host: "josh.earth",
      ref: "origin/main",
      repo: "git@github.com:joshmarinacci/vibe2dlayout.git",
      path: "/projects/draw-limn-deploy",
      "post-deploy": [
        "npm install",
        "npm run build",,
      ].join(" && ")
    }
  }
}
