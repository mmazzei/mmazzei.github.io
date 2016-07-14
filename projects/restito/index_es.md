---
title: RESTito
layout: project
project:
    name     : RESTito
    logo     : /projects/restito/logo.png
    storeUrl : https://itunes.apple.com/es/app/restito/id1133730938?mt=8
    version  : v1.0
    comments : |
        <p>RESTito es una pequeña app que te ayuda a ejecutar cualquier tipo de Request HTTP.</p>
        <p>Puedes utilizarla para probar tus APIs REST, detectar problemas en tu app o la red.</p>
        <p>Este es el sitio de soporte al usuario, espero que puedas obtener desde aquí toda la ayuda que necesites.</p>
        <p><a href="https://itunes.apple.com/es/app/restito/id1133730938?mt=8" style="display:inline-block;overflow:hidden;background:url(https://linkmaker.itunes.apple.com/images/badges/en-us/badge_appstore-lrg.svg) no-repeat;width:165px;height:40px;"></a></p>
        <p><a href="index.html">In ENGLISH, please.</a></p>
    bodyClass : restito
---
{% include authorDef.html %}

## Cómo se usa

Como la app no es tan grande ni compleja, creo que esta pequeña grabación explica cómo funciona mucho mejor que lo que podría hacerlo escribiendo:

![](example.gif){:.help}

¿Qué hice allí?

 1. Comencé mirando el historial donde las requests que voy ejecutando se guardan, con su cuerpo y encabezados.
 2. Creé una nueva request.
 3. La edité y luego ejecuté y miré los resultados.
 4. Regresé al historial y elegí un item cualquiera de allí para mostrar.

Nota: el historial almacenará sólo requests diferentes. Así que, si ejecutas dos veces la misma, ocupara sólo un lugar.

Nota 2: cualquier cambio en el cuerpo, encabezado o URL de la request la convierten en una diferente, así que será un nuevo item en el historial si se ejecuta.

## Necesito más ayuda

Si tienes consultas, encuentras errores, tienes sugerencias, lo que fuera, tan sólo escríbeme un email a: [send email](mailto:{{author.email}})

¡Gracias por descargar la app!