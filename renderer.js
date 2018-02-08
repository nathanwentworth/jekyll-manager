'use strict'

// Includes ///////////////////////////

const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const { dialog } = remote;
const fs = require('fs');
const yaml = require('yamljs')
const markdown = require("markdown").markdown

 
// Elements ///////////////////////////

const fileListElements = document.querySelectorAll('[data-file-list]')
const openButton = document.querySelector('[data-btn-open-directory]')
const siteNameElements = document.querySelectorAll('[data-site-name]')
const openSiteConfig = document.querySelector('[data-btn-site-config]')
const mainContainer = document.querySelector('main')

// Global Data ////////////////////////

let options = {
  directory: ''
}

let rootDirectoryList;

// Test Data //////////////////////////

const siteName = 'new site!'
const sampleFileNames = [
  '2014-02-04-my-first-post.md',
  '2014-02-06-second-post.md',
  '2015-01-01-happy-2015.md',
  '2017-07-05-havent-posted-in-a-while.md'
]

// App ////////////////////////////////

window.addEventListener('load', init, false)

function init() {
  let loadedDirectory = window.localStorage.getItem('directory')
  options.directory = loadedDirectory || false
  if (!options.directory) {
    console.log('no directory selected!')
    openButton.addEventListener('click', files.selectNewSiteDirectory, false)
    openButton.classList.remove('hidden')
  } else {
    readConfigFile()

    // files.getBaseDirectoryListing(options.directory)
    openSiteConfig.addEventListener('click', function () { console.log('site config!') }, true)

  }

  accordionInit()
    
  files.createPostList(sampleFileNames)
}

var files = function() {

  function getBaseDirectoryListing(directory) {
    fs.readdir(directory, (err, dir) => {
      if (err) {
        console.error(err);
      } else if (dir.length > 0) {
        console.log(dir)
        rootDirectoryList = dir
        // TODO: change this
        destroyChildren(fileListElements[0])
        parseRootDirectory(dir)
        readConfigFile()
      }
    })
  }

  function parseRootDirectory(directory) {
    for (let index = 0; index < directory.length; index++) {
      const element = directory[index];
      let button = document.createElement('button')
      
      if (element.match('_config.yml')) {
        button.innerText = 'Site Settings'
        button.addEventListener('click', openConfigFile, false)
      } else if (element.match('assets')) {
        button.innerText = 'Site Assets'
        button.addEventListener('click', function () { console.log('clicked on site assets') }, false)
      } else if (element.match('_site')) {
        button.innerText = 'Site Files'
        button.addEventListener('click', function () { console.log('clicked on site files') }, false)
      } else if (element.match)

      if (button.innerText) {
        fileListElements[0].appendChild(button)
      }
    }
  }

  function createPostList(files) {
    for (let i = 0; i < fileListElements.length; i++) {
      for (let j = 0; j < files.length; j++) {
        let listItem = document.createElement('button')
        listItem.textContent = prettifyName(files[j])
        listItem.setAttribute('data-btn-file-open', files[j])
        fileListElements[i].appendChild(listItem)
      }
    }
  }
  
  function selectNewSiteDirectory() {
    dialog.showOpenDialog({properties: ["openDirectory"]}, (folder) => {
      if (folder === undefined) {
        console.log("no file selected");
        return;
      } else {
        console.log(folder);
        options.directory = folder[0];
        getBaseDirectoryListing(options.directory)
        window.localStorage.setItem('directory', options.directory)
      }
    }) 
  }
  


  return {
    getBaseDirectoryListing: getBaseDirectoryListing,
    createPostList: createPostList,
    selectNewSiteDirectory: selectNewSiteDirectory
  }
}()


function destroyChildren(parent) {
  while (parent.firstChild !== null) {
    parent.removeChild(parent.firstChild)
  }
}

function openConfigFile() {
  console.log('opened the config file!');
  
}

function readConfigFile() {
  console.log('reading config file')
  let config = fs.readFileSync(options.directory + '/_config.yml', 'UTF8')
  let parsedConfig = yaml.parse(config)
  
  console.log(parsedConfig)

  setSiteTitle(parsedConfig.title)
  if (parsedConfig.collections) {
    getCollections(parsedConfig.collections)
  }
}

function setSiteTitle(title) {
  console.log(siteNameElements);
  
  for (let item of siteNameElements) {
    item.textContent = title || siteName
  }
}

function getCollections(collections) {
  let collectionKeys = Object.keys(collections)
  collectionKeys.unshift('posts')
  let postsSection = document.querySelector('[data-section-posts]')
  for (let index = 0; index < collectionKeys.length; index++) {
    const element = collectionKeys[index];
    let sectionHeader = document.createElement('h2')
    sectionHeader.textContent = element
    let collectionList = document.createElement('div')
    collectionList.setAttribute('data-file-list', element)
    collectionList.classList.add('clickable-list')

    postsSection.appendChild(sectionHeader)
    postsSection.appendChild(collectionList)

    getPostsInCollection(element)
  }
}

function getPostsInCollection(collection) {
  let container = document.querySelector(`[data-file-list=${collection}]`)
  let posts = fs.readdirSync(`${ options.directory }/_${ collection }`)
  if (posts) {
    posts = posts.reverse()
    for (let post of posts) {
      let postButton = document.createElement('button')
      postButton.textContent = prettifyName(post)
      postButton.setAttribute('data-file-name', `${options.directory }/_${collection}/${post}`)
      postButton.addEventListener('click', openFile)

      container.appendChild(postButton)
    }
  }
}

function openFile(e) {
  console.log('open ' + e.target.dataset.fileName);
  let content = fs.readFileSync(e.target.dataset.fileName, 'UTF8')
  mainContainer.innerHTML = markdown.toHTML(content)
}

function accordionInit() {
  var acc = document.querySelectorAll('[data-btn-accordion]')
  
  for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", accordionToggle);
  }
}

function accordionToggle(e) {
  /* Toggle between adding and removing the "active" class,
  to highlight the button that controls the panel */
  e.target.classList.toggle("active");

  /* Toggle between hiding and showing the active panel */
  var panel = e.target.nextElementSibling;
  if (panel.style.display === "block") {
    panel.style.display = "none";
  } else {
    panel.style.display = "block";
  }

}

function prettifyName(name) {
  let prettyName = name
  prettyName = prettyName.replace(/\d{1,}-\d{1,}-\d{1,}-/g, '')
  prettyName = prettyName.replace(/-/g, ' ')
  prettyName = prettyName.replace('.md', '')
  return prettyName
}
