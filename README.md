This is a forked version of [bitbucket-pr-review](https://github.com/reywood/bitbucket-pr-review) with additional features such as:

-   Close all files by a specific file extension. (All file extensions are loaded on init)
-   Bitbucket file titles become sticky so the file action buttons come along for the ride when you're scrolling large files.
-   Themes!

### Installation

To install, you must install this repo as an unpackaged extension.

1. Download or clone the repo.
2. Open Chrome Extensions, and make sure the "Developer Mode" option is checked in the upper top corner.
3. Click Load unpacked and select the downloaded repo directory.
4. Go to any bitbucket PR and enjoy the goodies

### Themes
##### (Beta)

To configure a theme for your PRs, go to the Extension Details and click `Extension Options` to select your theme.

### Original Repo README
```
During the back and forth of reviewing a large pull request, it's easy to lose track of
what you've already reviewed and what you haven't. This extension adds a new button to
the header of each file in a pull request that allows you to toggle the reviewed/unreviewed
status of that file. If the file is later updated or commented on after you've marked it as
reviewed, it will revert to the unreviewed state. This makes it much easier to focus on only
the files that need your attention.
```
