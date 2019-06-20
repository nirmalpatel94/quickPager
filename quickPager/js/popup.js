let hasStyle = false;

function savePort(port) {
  chrome.storage.local.set({ 'port': port }, function() {
    console.log('Saving Port ' + port);
  });
}

function parseHTML(html) {
  $('#loading').hide();
  let port = $('#Port-choice').val();
  $('.Port-error').hide();

  // Initialize the DOM parser
  let parser = new DOMParser();

  // Parse the text
  let doc = parser.parseFromString(html, "text/html");

  if (!hasStyle) {
    $(document.head).append($(doc.head).find('style'));
    hasStyle = true;
  }

  $('.Port').siblings().remove();

  // pick the sections we care about
  $(document.body).append($(doc).find('.Proxy'));
  $(document.body).append($(doc).find('.Templates'));
  $(document.body).append($(doc).find('.Tasks'));

  // intercept link clicks and navigate through extension api
  $('a').click(function(evt) {
    evt.preventDefault();
    const href = $(this).attr('href');
    chrome.tabs.update({
      url: "https://localhost:" + port + href
    });
  });

  // modify form actions to not have relative path
  $('form').each(function() {
    if ($(this).attr('action')) {
      $(this).attr('action', 'https://localhost:' + port + $(this).attr('action'));
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

const fetchContent = () => {
  let port = $('#Port-choice').val();
  fetch('https://localhost:' + port)
  .then(function(response) {
    // When the page is loaded convert it to text
    return response.text()
  })
  .then(parseHTML)
  .catch(function(err) {
    $('.Port-error').show();
    $('.Port').siblings().remove();
    console.log('Failed to fetch page: ', err);
  });
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
});

