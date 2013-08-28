$(function() {  
  runTest();
});

runTest = function() {
  $info = $('.js-info-box').html('Press first cell');

  $('.table').one('click','td', function(event) {
    var element1 = $(this);
    $info.html('Clicked on ' + $(this).text() + ', now press content element');

    $('.table').one('click', 'td', function() {
      var element2 = $(this);
      var xpath = $.xpath(element1, element2);
      $info.html('Clicked on ' + element1.text() + ' and ' + element2.text() +
                  ', xpath result: <br> ' + xpath);
      $('<br><button class="btn pull-right">Run again</button>').prependTo($info)
      .on('click', function() {
        runTest();
      });
    });
  });
};
