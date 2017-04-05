jQuery(document).ready(function($) {
  $('input[type="checkbox"], input[type="radio"]').on('change', function() {
    ( $(this).val() === 'true' ) ? $(this).parents('[class^="checkbox"], [class^="radio"]').toggleClass('correct') : $(this).parents('[class^="checkbox"], [class^="radio"]').toggleClass('false');
  });
});
