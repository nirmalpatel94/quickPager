/**
 * Save current port in chrome local storage
 * @param {number} port
 */
function savePort(port) {
  chrome.storage.local.set({ 'port': port }, function() {
    console.log('Saving Port ' + port);
  });
}


/**
 * Parse pager html and add it to extension popup
 * @param {string} html
 */
function parseHTML(html) {
  $('#loading').hide();
  let port = $('#Port-choice').val();
  $('.Port-error').hide();

  // Initialize the DOM parser
  let parser = new DOMParser();

  // Parse the text
  let doc = parser.parseFromString(html, "text/html");

  // remove pager content and repopulate
  $('.essentials').siblings().remove();

  // pick the sections we care about
  $(document.body).append($(doc).find('.Proxy'));
  $(document.body).append($(doc).find('.Templates'));
  $(document.body).append($(doc).find('.Tasks'));

  // intercept link clicks and navigate through extension api
  $('a:not(.whitelist)').click(function(evt) {
    evt.preventDefault();
    const href = $(this).attr('href');
    chrome.tabs.update({
      url: "https://localhost:" + port + href
    });
  });

  // modify form actions to not have relative path
  $('form').each(function() {
    let action = $(this).attr('action');
    if (action) {
      if (!action.startsWith('/')) {
        action = '/' + action;
      }

      $(this).attr('action', 'https://localhost:' + port + action);
    }
  });

  // reload the popup html
  $('form').submit(() => {
    $('#loading').show();
  });

  $('form').each(function() {
    if ($(this).attr('action')) {
      $(this).ajaxForm(function(resp) {
        parseHTML(resp);
      });
    }
  });
}

/**
 * fetch html from pager
 */
function fetchContent() {
  let port = $('#Port-choice').val();
  fetch('https://localhost:' + port)
  .then(function(response) {
    // When the page is loaded convert it to text
    return response.text()
  })
  .then(parseHTML)
  .catch(function(err) {
    $('#loading').hide();
    $('.Port-error').show();
    $('.essentials').siblings().remove();
    console.log('Failed to fetch page: ', err);
  });
}

/**
 * Create links to knowledge graph for the brand and the entity currently being
 * viewed using the .json for the current tab
 */
async function fetchKnowledgeGraphLinks() {

  // query the current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var currTab = tabs[0];

    // currTab will only exist when on localhost/yextpages domains
    if (currTab && currTab.url) {
      let url = currTab.url.split('?')[0]; // remove query params

      // remove .html from url if exists
      if (url.endsWith('.html')) {
        url = removeExtension(url);
      }

      // need to check index.json when on root page
      if (url.endsWith('.net')) {
        url += '/index';
      } else if (url.endsWith('.net/')) {
        url += 'index';
      }

      // fetch json for the page
      fetch(url + '.json')
      .then(async (res) => {
        const json = await res.json();

        if (json) {
          if (json.businessId) {
            $('#knowledge-manager-button').attr('href', `https://www.yext.com/s/${json.businessId}/entities`);
            $('#knowledge-manager-button').show();
          }

          let entityID = json.id;

          if (!entityID && json.profile && json.profile.meta) {
            entityID = json.profile.meta.yextId;
          }

          if (entityID) {
            $('#entity-button').attr('href', `https://www.yext.com/s/${json.businessId}/entity/edit?entityIds=${entityID}`);
            $('#entity-button').show();
          }
        }
      })
    }
  });
}

/**
 * Remove file extension from a string
 * @param {string} str
 */
function removeExtension (str){
  var lastDotPosition = str.lastIndexOf('.');
  if (lastDotPosition === -1) {
    return str;
  } else {
    return str.substr(0, lastDotPosition);
  }
}

$(document).ready(() => {
  $('#Port-form').on('submit', () => {
    savePort($('#Port-choice').val());
    fetchContent();
  });

  chrome.storage.local.get('port', function (result) {
    let port = result.port;

    if (port) {
      $('#Port-choice').val(port);
    } else {
      $('#Port-choice').val(9028);
    }

    fetchContent();
  });

  fetchKnowledgeGraphLinks();
});

