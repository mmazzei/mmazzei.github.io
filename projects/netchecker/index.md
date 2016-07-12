---
title: NetChecker
layout: project
project:
    name     : NetChecker
    logo     : /projects/netchecker/logo.png
    storeUrl : http://itunes.apple.com/ar/app/cronito/id1110080435?mt=8
    version  : v1.0
    comments : |
        <p>NetChecker is a lightweight app to help you execute any kind of HTTP Request.</p>
        <p>You can use it to test your REST APIs, to detect problems in your app or your network.</p>
        <p>This is the support page, hope you get the help you need from here.</p>
        <!-- TODO - Colocar el enlace correcto -->
        <p><a href="https://geo.itunes.apple.com/us/app/cronito/id1110080435?mt=8" style="display:inline-block;overflow:hidden;background:url(https://linkmaker.itunes.apple.com/images/badges/en-us/badge_appstore-lrg.svg) no-repeat;width:165px;height:40px;"></a></p>
        <p><a href="index_es.html">En ESPAÑOL, por favor.</a></p>
    bodyClass : netchecker
---
{% include authorDef.html %}

## How to use

Instead of writing long about how to use it, as the app is not so big or complex, I think this small recording will explain itself:

![](example.gif){:.help}

What I did there?

 1. Started looking at the request history, where the requests are stored with their body and header.
 2. Created a new request.
 3. Executed the request.
 4. Went back to the history and selected some item from there.

Note: the history will store only different requests, so if you execute two times the same, will be stored only one.

Note 2: any change on the request body, header or URL make it different, so will be a new item in the history.

## I need some help

If you have questions, found errors, have suggestions, anything, just send me an email: [send email](mailto:{{author.email}})

Thanks for download this app!