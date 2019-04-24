let hasStyle = false;

const fetchContent = () => {
  let port = $('#Port-choice').val();
  fetch('https://localhost:' + port)
  .then(function(response) {
    // When the page is loaded convert it to text
    return response.text()
  })
  .then(function(html) {
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
      $(this).attr('action', 'https://localhost:' + port + $(this).attr('action'));
    });

    // reload the popup html
    // TODO: make it listen to request and handle it that way
    $('form').submit(() => {
      setTimeout(() => {
        window.location.reload();
      }, 200);
    });
  })
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

function savePort(port) {
  chrome.storage.local.set({ 'port': port }, function() {
    console.log('Saving Port ' + port);
  });
}
