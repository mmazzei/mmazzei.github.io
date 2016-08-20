---
title: Tabs como las de Android en iOS
layout: post
tags: varios
---

Hace unos días estaba por clonar una app de Android a iOS. La UI se veía muy sencilla, aunque con algunas claras diferencias respecto a lo que es habitual en esta plataforma.

Una diferencia en particular me resultó más compleja que lo que inicialmente suponía. Como supongo que hay más gente con requerimientos similares, voy a dejar aquí una versión más o menos genérica para que reutilices en tu proyecto si te gusta.

No pretende ser prolijo ni completo. Me sirvió como prueba de concepto y quizá a alguien más como base desde la que implementar algo mejor. Pero aquí va el código fuente del ejemplo: [https://github.com/mmazzei/AndroidLikeTabsForIOS](https://github.com/mmazzei/AndroidLikeTabsForIOS)

## Ingredientes:

 1. Un segmented control sin bordes, con sólo una barrita de color que indique la opción elegida.
 2. Un container view donde mostrar el view controller seleccionado.
 3. Los view controllers hijos

## El Segmented Control

Como el `UISegmentedControl` provisto por `UIKit` tiene un aspecto muy diferente al que se necesita, hay que modificarlo demasiado para que se parezca.

Preferí, por el contrario, crear un nuevo `UIControl` llamado `UnderlineSegmentedControl`, porque brinda más control sobre el aspecto obtenido. Además de que me resultaba mucho más fácil implementarla que cambiar el `UISegmentedControl`, y que algunos de los cambios que había que hacerle al original eran medio hackeriles.

Como no encontré manera de agregar desde el Storyboard las opciones, sólo queda agregarlas a mano:

    mySegmentedControl.appendSegment("One")
    mySegmentedControl.appendSegment("Two")
    mySegmentedControl.appendSegment("Three")
    mySegmentedControl.setSelectedSegmentIndex(0, animated: false)

Si sólo necesitas este `UIControl` en tu proyecto, es suficiente con que copies el archivo `UnderlineSegmentedControl`.


## El View Controller

Suelo tratar siempre de que las relaciones entre los `UIViewController` de mis app queden plasmadas en `Storyboards`. Para ello se utilizan las `segues`.

Algunos `UIViewController` nativos, como `UITabBarController` o `UISplitViewController` permiten establecer la relación desde el storyboard de un modo muy prolijo. Sin embargo esto no es posible sin un pequeño workaround para los `UIViewController` propios.

Este workaround consistió en agregar una segue cuyo método `perform` está vacío. Esto implica que no hace nada al ejecutarse, de allí el nombre que le dí: `NoOpSegue.

Con esta segue conecto los child view controllers al que contiene la container view.

[![](/images/2016-08-20-android-tabs-storyboard.png)](/images/2016-08-20-android-tabs-storyboard.png)

Para mostrar un view controller sigo los pasos que se explican en la [doc de Apple](https://developer.apple.com/library/ios/featuredarticles/ViewControllerPGforiPhoneOS/ImplementingaContainerViewController.html). La implementación con parte de esta doc copipasteada para que quede bien claro lo que hace, está en `AndroidLikeViewController.addChild(childVC:)`.

Como decía antes, las segues con que conectamos el controller a los hijos no hace nada, por lo que es necesario implementar las trancisiones. Inicialmente también seguí los pasos que se indican en la doc, pero me quedaba un poco extenso el código ya que había que jugar un poco con las constraints para lograr la animación de slide-in/slide-out, por lo que luego borré toda esa parte e incluí el framework `IBAnimatable`, que andaba con ganas de probar. El resultante puede verse en `AndroidLikeViewController.cycle(from:to:toDirection)`.

Allí se crea un `ContainerTransition`, una clase de `IBAnimatable` que se encarga de ejecutar la animación y llamar a `removeFromParentViewController` y `didMoveToParentViewController` cuando es necesario.

Lo único que falta ahora es indicarle al `AndroidLikeViewController` cómo mostrar las opciones (el nombre de cada solapa) y a qué `UIViewController` corresponde cada una.

Como no encontré forma de agregar metadata a las segues (por ejemplo: "Nombre de la opción en pantalla que ejecuta este segue"), ni de obtener todas las segues que parten desde el `AndroidLikeViewController` (hay opciones, pero dependen de APIs no documentadas de Apple), no queda otra que hacerlo desde el código.

Podría utilizar un delegate para ello, algo así como:

    protocol AndroidLikeViewController: class {
        func titleFor(tab index: Int) -> String
        func segueIdFor(tab index: Int) -> String
    }

Pero no me interesó ya que sólo tengo uno de estos controllers en toda la app y las solapas a mostrar son siempre las mismas, con lo que me basté de la herencia y sobreescribir el viewDidLoad para cargar esta info:

    class ExampleAndroidLikeVC: AndroidLikeViewController {
      override func viewDidLoad() {
        addChild(segueId: "FirstSegue", title: "FIRST")
        addChild(segueId: "SecondSegue", title: "SECOND")
        addChild(segueId: "ThirdSegue", title: "THIRD")

        super.viewDidLoad()
      }
    }


[![](/images/2016-08-20-android-tabs-screencast.gif)](/images/2016-08-20-android-tabs-screencast.gif)
