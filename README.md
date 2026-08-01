<h3 align="center"><img width="80" alt="Browser.js" src="./assets/icon-256.png"></h3>

<h3 align="center">Highly Configurable Browser Environment for the Web</h3>

<p align="center">
    <a href="https://puter.com/app/browser"><strong>« LIVE DEMO »</strong></a>
    <br />
    <br />
    <a href="https://puter.com">Puter.com</a>
    ·
    <a href="https://discord.com/invite/PQcx7Teh8u">Discord</a>
    ·
    <a href="https://reddit.com/r/puter">Reddit</a>
    ·
    <a href="https://twitter.com/HeyPuter">X</a>
</p>
<h3 align="center"><img style="border-radius:5px;" alt="screenshot" src="./assets/screenshot.png"></h3>

<br>

# Browser.js

"A browser in a browser!", Browser.js is a highly configurable browser environment for the web.

It can be used as:

- An end-to-end encrypted, cloud-based browser accessible from any device at anytime
- A headless browser that can be embedded in other websites and applications
- A fast, lightweight, and no-installation alternative to Puppeteer, Playwright, and Selenium
- An alternative to Ultraviolet, Rammerhead, and other web proxy browsers

<br>

## Getting Started

See [CONTRIBUTING.md](/CONTRIBUTING.md) for build instructions

<br>

## Publish the static Chrome UI

The reusable publisher is `scripts/publish-static-chrome.sh`. It accepts a
target directory and build parameters, so it is not tied to a particular
deployment target. For the two maintained targets, use:

```bash
# Standalone browser.gear.sh
pnpm publish:browser-gear

# Gear Shell's /browser/ static subpath
pnpm publish:gear-shell-browser
```

The target-specific commands can be redirected to another checkout with
`BROWSER_GEAR_DIR` or `GEAR_BROWSER_DIR`. For a custom target, invoke the
generic tool directly:

```bash
bash scripts/publish-static-chrome.sh \
  --target-dir ../some-static-site \
  --base-path /browser/ \
  --isolation-origin https://greggang.com \
  --wisp-url wss://browserjs-production.up.railway.app/wisp/
```

Each command builds the runtime and Chrome UI, synchronizes the static files,
verifies the PWA settings, and refuses to overwrite uncommitted target changes.
The Gear Shell command preserves its deployment README. Both deliberately leave
review, commit, and push to you.

<br>

## Support

Connect with the maintainers and community through these channels:

- Bug report or feature request? Please [open an issue](https://github.com/HeyPuter/browser.js/issues/new/choose).
- Discord: [discord.com/invite/PQcx7Teh8u](https://discord.com/invite/PQcx7Teh8u)
- X (Twitter): [x.com/HeyPuter](https://x.com/HeyPuter)
- Reddit: [reddit.com/r/puter/](https://www.reddit.com/r/puter/)
- Mastodon: [mastodon.social/@puter](https://mastodon.social/@puter)
- Security issues? [security@puter.com](mailto:security@puter.com)
- Email maintainers at [hi@puter.com](mailto:hi@puter.com)

We are always happy to help you with any questions you may have. Don't hesitate to ask!

<br/>

## License

This repository, including all its contents, sub-projects, modules, and components, is licensed under [AGPL-3.0](https://github.com/HeyPuter/puter/blob/main/LICENSE.txt) unless explicitly stated otherwise. Third-party libraries included in this repository may be subject to their own licenses.

<br/>
