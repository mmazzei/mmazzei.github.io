$().ready(function(){
  collectAllThePostTagsFromTheBadges()
  createTheTagsFilterWithBadges()
});

var tags = []

function collectAllThePostTagsFromTheBadges() {
  $(".posts .badge").each(function(el) {
    var postTag = $(el).getClass().split(" ")[1]; /* discard the "badges" class */
    if(tags.indexOf(postTag) < 0) {
       tags.push(postTag);
    }
  });
  tags = tags.sort()
}

function createTheTagsFilterWithBadges() {
  $(".badgeSelector").html("")
  for (var i = 0; i < tags.length; i++) {
    $(".badgeSelector").htmlAppend("<span class=\"badge "+tags[i]+"\">"+tags[i]+"</span> ")
  }

  $(".badgeSelector .badge").on("click", function(elem) {
    if ($(elem.target).hasClass("selected")) {
      clearFilter()
      return;
    }

    var clickedTag = $(elem.target).getClass().split(" ")[1];
    filterByTag(clickedTag)
  });
}

function clearFilter() {
  $(".archive .posts li").show();
  $(".badgeSelector .badge").removeClass("selected");
}

function filterByTag(tag) {
  $(".archive .posts li").hide()
  var matchingPosts = $(".archive .posts .badge."+tag)
  for (var i = 0; i < matchingPosts.length; i++) { // parent css selector doesn't work in safari
    $(matchingPosts[i].parentElement).show()
  }

  $(".badgeSelector .badge").removeClass("selected");
  $(".badgeSelector .badge."+tag).toggleClass("selected");
}