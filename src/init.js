// Get the theme as set in the extension options
chrome.storage.sync.get({theme: ''}, ({theme}) => {
    document.getElementById('pullrequest-diff').classList += theme;
});

// Initialize File Types Mapping
const fileTypes = {};

function createHelperMenuDom() {
    const allFileTypes = Object.entries(fileTypes);
    let allFileTypeButtons = '';
    allFileTypes.forEach(type => {
        allFileTypeButtons += `
            <li><button class="bbpr-mark-all-files" id="mark-all-${type[0]}">Mark all .${type[0]} (${type[1]}) files as reviewed</button></li>
        `;
    });
    const menuContainer = document.createElement('div');
    menuContainer.id = 'bbpr-menu';
    menuContainer.className = 'bbpr-menu';
    menuContainer.innerHTML = `
        <button class="bbpr-menu-btn">
            Review Menu ▼
        </button>
        <ul class="bbpr-menu-items">
            <li><button class="bbpr-display-all-btn">Display all reviewed diffs</button></li>
            <li><button class="bbpr-hide-all-btn">Hide all reviewed diffs</button></li>
            <li><button class="bbpr-mark-all">Mark all files as reviewed</button></li>
            ${allFileTypeButtons}
            <li><button class="bbpr-unmark-all">Mark all files as unreviewed</button></li>
        </ul>
    `;
    return menuContainer;
}

function getAllFileDiffs() {
    return Array.from(document.querySelectorAll('#changeset-diff .bb-udiff'))
        .map(section => new FileDiff(section));
}

function addFileType(filepath) {
    const file = filepath.split('/').reverse()[0];
    let type = file.split('.');
    type.shift();
    type = type.join('.');
    if (!fileTypes[type]) fileTypes[type] = 1;
    else fileTypes[type] += 1;
}

function toggleMenu() {
    const menuContainer = document.getElementById('bbpr-menu');
    menuContainer.classList.toggle('bbpr-open');
}

function closeMenu() {
    const menuContainer = document.getElementById('bbpr-menu');
    menuContainer.classList.remove('bbpr-open');
}

function closeMenuOnBodyClick(e) {
    const menuContainer = document.getElementById('bbpr-menu');
    if (menuContainer) {
        const allMenuButtons = Array.from(menuContainer.querySelectorAll('button'));
        const isMenuClick = allMenuButtons.some(btn => btn === e.target);
        if (!isMenuClick) {
            closeMenu();
        }
    }
}

function displayAll() {
    const pullRequestDiff = document.getElementById('pullrequest-diff');
    pullRequestDiff.classList.add('bbpr-open-all-diffs');
    closeMenu();
}

function hideAll() {
    const pullRequestDiff = document.getElementById('pullrequest-diff');
    pullRequestDiff.classList.remove('bbpr-open-all-diffs');
    closeMenu();
}

function setAllToReviewed() {
    getAllFileDiffs().forEach(fileDiff => fileDiff.setReviewed());
    closeMenu();
}

function setAllFilesToReviewed(fileTypeSelect) {
    const fileTypeExt = `.${fileTypeSelect.target.id.split('-').reverse()[0]}`;
    getAllFileDiffs().forEach((fileDiff) => {
        if (fileDiff.element.id.includes(fileTypeExt)) fileDiff.setReviewed();
    });
    closeMenu();
}

function setAllToUnreviewed() {
    getAllFileDiffs().forEach(fileDiff => fileDiff.setUnreviewed());
    closeMenu();
}

function addHelperMenuEventListeners(menuContainer) {
    const menuButton = menuContainer.querySelector('.bbpr-menu-btn');
    const displayAllButton = menuContainer.querySelector('.bbpr-display-all-btn');
    const hideAllButton = menuContainer.querySelector('.bbpr-hide-all-btn');
    const markAllButton = menuContainer.querySelector('.bbpr-mark-all');
    const markAllFilesButton = menuContainer.querySelectorAll('.bbpr-mark-all-files');
    const unmarkAllButton = menuContainer.querySelector('.bbpr-unmark-all');

    menuButton.addEventListener('click', toggleMenu);
    displayAllButton.addEventListener('click', displayAll);
    hideAllButton.addEventListener('click', hideAll);
    markAllButton.addEventListener('click', setAllToReviewed);
    markAllFilesButton.forEach(btn => btn.addEventListener('click', setAllFilesToReviewed));
    unmarkAllButton.addEventListener('click', setAllToUnreviewed);

    document.body.addEventListener('click', closeMenuOnBodyClick);
}

function initHelperMenu() {
    const pullRequestDiff = document.getElementById('pullrequest-diff');
    const menuContainer = createHelperMenuDom();
    addHelperMenuEventListeners(menuContainer);
    pullRequestDiff.insertBefore(menuContainer, pullRequestDiff.querySelector('#compare'));
}

function repeatInitUIToWorkAroundCommentLoadIssue(fileDiff, count = 0) {
    fileDiff.updateDisplay();
    if (count < 5) {
        setTimeout(() => { repeatInitUIToWorkAroundCommentLoadIssue(fileDiff, count + 1); }, 100);
    }
}

function waitForFileSectionLoad(fileSectionSelector) {
    const fileDiffDom = document.querySelector(fileSectionSelector);
    if (fileDiffDom) {
        const alreadyHasButton = !!fileDiffDom.querySelector('.bbpr-buttons');
        if (!alreadyHasButton) {
            const fileDiff = new FileDiff(fileDiffDom);
            fileDiff.initUI();
            repeatInitUIToWorkAroundCommentLoadIssue(fileDiff, 0);
        }
    } else {
        setTimeout(waitForFileSectionLoad, 100, fileSectionSelector);
    }
}

function initAnotherChanceFiles(anotherChanceFiles) {
    anotherChanceFiles.forEach((file) => {
        const fileSection = file.closest('.bb-udiff');
        const fileSectionSelector = `#changeset-diff .bb-udiff[data-path="${fileSection.dataset.identifier}"]`;
        file.addEventListener('click', () => {
            waitForFileSectionLoad(fileSectionSelector);
        });
        const fileLinkSelector = `#commit-files-summary li[data-file-identifier="${fileSection.dataset.identifier}"] a`;
        const fileLink = document.querySelector(fileLinkSelector);
        if (fileLink) {
            fileLink.addEventListener('click', () => {
                waitForFileSectionLoad(fileSectionSelector);
            });
        }
        (async () => {
            if (await DataStore.hasEverBeenReviewed(fileSection.dataset.identifier)) {
                file.click();
            }
        })();
    });
}

function waitForAnotherChanceFilesLoad(previousAttemptFileCount, tries = 0) {
    const anotherChanceFiles = document.querySelectorAll('.load-diff.try-again');
    const areSameNumberOfFilesAsLastTry = anotherChanceFiles.length === previousAttemptFileCount;
    const triesWithCurrentCount = areSameNumberOfFilesAsLastTry ? tries + 1 : 0;

    if (triesWithCurrentCount > 3) {
        initAnotherChanceFiles(anotherChanceFiles);
    } else {
        setTimeout(() => {
            waitForAnotherChanceFilesLoad(anotherChanceFiles.length, triesWithCurrentCount);
        }, 100);
    }
}

function init() {
    const fileDiffs = getAllFileDiffs();
    fileDiffs.forEach((fileDiff) => {
        fileDiff.initUI();
        repeatInitUIToWorkAroundCommentLoadIssue(fileDiff);
        addFileType(fileDiff.filepath)
    });
    initHelperMenu();

    waitForAnotherChanceFilesLoad(0);

    if (window.location.hash.indexOf('#chg-') >= 0) {
        const identifier = window.location.hash.substring(5);
        const fileSectionSelector = `#changeset-diff .bb-udiff[data-path="${identifier}"]`;
        waitForFileSectionLoad(fileSectionSelector);
    }
}

function isDiffTabActive() {
    const tabMenu = document.querySelector('.pr-tab-links');
    if (!tabMenu) {
        console.log('tab menu not found');
        return false;
    }
    const activeTab = tabMenu.querySelector('.active-tab [data-tab-link-id]');
    return !!activeTab && activeTab.dataset.tabLinkId === 'diff';
}

function waitForDiffLoad() {
    if (!isDiffTabActive()) return;

    const isDiffDomLoaded = !!document.querySelector('#pullrequest-diff .main');
    if (isDiffDomLoaded) init();
    else setTimeout(waitForDiffLoad, 100);
}

function addDiffTabClickHandler() {
    const tabMenuDiffLink = document.querySelector('.pr-tab-links #pr-menu-diff');
    if (tabMenuDiffLink) {
        tabMenuDiffLink.addEventListener('click', () => {
            setTimeout(waitForDiffLoad, 100);
        });
    }
}

waitForDiffLoad();
addDiffTabClickHandler();
