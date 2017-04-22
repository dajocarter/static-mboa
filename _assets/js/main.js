jQuery(document).ready(function($) {
  $('input[type="checkbox"], input[type="radio"]').on('change', function() {
    ( $(this).val() === 'true' ) ? $(this).parents('.checkbox, .radio').toggleClass('correct') : $(this).parents('.checkbox, .radio').toggleClass('false');
  });

  $('.answer-check').on('input', function() {
    var input = $(this);
    var answers = input.data('answers');
    var userAnswer = input.val();
    var value = false;
    for (var i = 0; i < answers.length; i++) {
      if (answers[i].toLowerCase() === userAnswer.toLowerCase()) {
        value = true;
      }
    }
    ( value ) ? input.parent('.input-group').addClass('correct').removeClass('false') : input.parent('.input-group').addClass('false').removeClass('correct');
  });

  $('td input').on('click', function() {
    var answers = ["high", "low", "normal", "normal"];
    var index = $(this).attr('name');
    if ($('input:radio[name=' + index + ']:checked').val() === answers[index]) {
      $('input:radio[name=' + index + ']').parent().removeClass();
      $(this).parent().addClass('correct');
    } else {
      $('input:radio[name=' + index + ']').parent().removeClass();
      $(this).parent().addClass('wrong');
    }
  });

  $('#quizSubmit').click(function(e) {
    e.preventDefault();

    $('label.list-group-item-text').removeClass('correct wrong');

    function scrollTo(element, to, duration) {
      if (duration < 0) return;
      var difference = to - element.scrollTop;
      var perTick = difference / duration * 2;

      setTimeout(function() {
          element.scrollTop = element.scrollTop + perTick;
          scrollTo(element, to, duration - 2);
      }, 10);
    }

    scrollTo(document.body, 0, 100);

    $("input:checked").each(function(index) {
      var question = index + 1;
      var choice = $(this).val();

      ( choice === 'true' ) ? $(this).parent().addClass('correct') : $(this).parent().addClass('wrong');
    });
  });
});
