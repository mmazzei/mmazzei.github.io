---
title: Lo que entendí de Type Erasure en Swift
layout: post
tags: varios
---

* TOC
{:toc}

## ¿Qué?

Supongamos que tenemos una clase sobre la que queremos aplicar el patrón `Delegate`, algo bastante común mientras se desarrolla para iOS.

Como ejemplo hipotético, queremos representar un estante con espacio para dos ítems. Si se intenta almacenar algo y está lleno, no hace nada. Si logra hacerlo, le avisa al delegado.


    protocol ShelfDelegate: class {
        func shelf(shelf: Shelf, didStore item: Any)
    }

    class Shelf {
        weak var delegate: ShelfDelegate?
        private (set) var storedItems: [Any] = []

        func store(item: Any) {
            guard storedItems.count < 2 else { return }

            storedItems.append(item)
            delegate?.shelf(self, didStore: item)
        }
    }


Entonces, la forma en que podríamos utilizar esta extraña clase sería algo así como:


    class BookShelfView: UIView {
        var shelf: Shelf {
            didSet { shelf.delegate = self }
        }
    }

    extension BookShelfView: ShelfDelegate {
        func shelf(shelf: Shelf, didStore item: Any) {
            guard let book = item as? Book else { return }

            doSomethingRelated(with: book)
        }
    }


Este código no tendría ningún problema si no fuera por el casteo `as?` que puede verse en la función del delegado, ya que:

  - si sabemos que se trata de una estantería de libros (_bookshelf_), sólo cabría esperar un libro, no habría necesidad de castear nada, de agregar una condición.
  - si puede tratarse de un `Shelf` que contenga cualquier otra cosa, ¿por qué estamos utilizando una vista creada para estanterías de libros? ¿no será un posible bug?

Queremos mitigar tanto el posible bug como la necesidad de agregar una condición, cosa que odiamos hacer tanto siendo desarrolladores como siendo personas, porque sabemos que no hay nada más doloroso y proclive a errores que agregar 'ifs'. Si no, tomemos como ejemplo esas leyes tan llenas de condiciones que uno siempre puede encontrar un recoveco para hacer algo que va en contra del espíritu con que se redactaron, pero manteniendo la legalidad.

Entonces, como el dolor de usar generics es a corto plazo y el de usar ifs es a largo plazo, somos medianamente racionales y nos embarcamos en dicha tarea, comenzando por agregar información de tipos al estante:


    class Shelf<ItemType> {
        weak var delegate: ShelfDelegate? // <- ERROR
        private (set) var storedItems: [ItemType] = []

        func store(item: ItemType) {
            guard storedItems.count < 2 else { return }

            storedItems.append(item)
            delegate?.shelf(self, didStore: item)
        }
    }


A partir de ahora, un estante sólo puede tener objetos de un único tipo, aquél que explícitamente decidamos al momento de crearlo.

Parece fácil ¿no? No. Esto recién empieza. Si prestamos un poco de atención, vemos que en la segunda línea hay un sutil comentario diciendo "ERROR". Eso es porque todavía hay que actualizar el `protocol ShelfDelegate`, ya que la gracia es que quien lo implemente no tenga que castear.

El problema es que, en Swift 2.x, no se pueden utilizar generics en un protocol. El compilador nos lo explica con un instructivo mensaje diciendo que _"Protocols do not allow generic parameters; use associated types instead"_.


    protocol ShelfDelegate: class {
        associatedtype IType // No "ItemType", para evitar confusiones luego
        func shelf(shelf: Shelf, didStore item: IType)
    }


Para el caso es lo mismo, estoy definiendo un tipo abstracto que, cuando se haga concreto por alguna especialización, sólo permitirá un tipo de valores.

Por ejemplo, esta podría definir un delegado para utilizar en estantes que contengan herramientas y no otra cosa:


    class ToolsShelfDelegate: ShelfDelegate {
        func shelf(shelf: Shelf, didStore tool: Tool) {
            // <- No if :-D
            doSomethingRelated(with: tool)
        }
    }


Todo podría estar, para esta altura, felizmente resuelto si no fuera por el infame mensaje de error que a más de uno le habrá hecho pegar la vuelta y volver al confortable, viejo y querido casteo, si total en C se han hecho tantas cosas bellas...: _"Protocol 'ShelfDelegate' can only be used as a generic constraint because it has Self or associated type requirements"_.

Le damos un poco de zoom al código para ver dónde está el error:


    class Shelf<ItemType> {
        weak var delegate: ShelfDelegate? // <- ERROR


Más zoom:


    weak var delegate: ShelfDelegate? // <- ERROR


Más zoom:


    ShelfDelegate?


Más zoom:


    Delegate


Y así sucesivamente hasta el pixel, pero no encontramos ni una pista.


## ¿Por qué?

Lo que ocurre aquí es que `ShelfDelegate` a secas no es un tipo concreto. Es algo de lo que sólo sabemos que tiene un método `shelf:didStore:` que funciona sobre algún tipo de ítems y, lamentablemente, no tenemos manera de restringir desde `Shelf` el tipo de items que el `delegate` debería soportar.

Otro ejemplo donde ocurriría algo así:


    let a: [ShelfDelegate] // <- ERROR


Más allá de por qué demonios alguien querría un `array` de delegados, interesa el entender la causa del error. Y como en esta sección "¿Por qué?" dije mucho sin explicar nada, pasemos a la siguiente sección "¿Pero por qué?".

{% include figure.html figure="http://placekitten.com/g/200/200" caption="Si para esta altura no hubiese una imagen, nadie continuaría." %}


## ¿Pero por qué?

Volvamos al origen, cuando todavía eramos inocentes y tratábamos de dibujar cosas en la pantalla (es el "Hola mundo" de la programación orientada a objetos)... Los viejos tiempos, varchars y punteros retozando en praderas de RAM.

Podíamos haber escrito el siguiente código:


    func draw(triangle: Triangle) {
        goTo(triangle.firstVertex)
        drawLineTo(triangle.secondVertex)
        drawLineTo(triangle.thirdVertex)
        drawLineTo(triangle.firstVertex)
    }


Entonces necesitábamos otra función para dibujar cuadrados. Nos avivamos enseguida y, antes de escribir nada, [encontramos patrones](https://youtu.be/GP3Fj2CZbXQ), revoloteando como mariposas de caracteres en nuestro viejo monitor CRT de catorce pulgadas.

Refactorizamos la anterior como:


    func draw(triangle: Triangle) {
        goTo(triangle.vertices[0])
        triangle.vertices.suffixFrom(1).forEach {
            self.drawLineTo($0)
        }
    }


Entonces, definimos:


    protocol Polygon {
        var vertices: [Vertex] { get }
    }


Y la función que teníamos de antes, como sólo necesitaba acceder a los vértices del parámetro, podría aplicar sobre cualquier Polygon:


    func draw(polygon: Polygon) {
        goTo(polygon.vertices[0])
        polygon.vertices.suffixFrom(1).forEach {
            self.drawLineTo($0)
        }
    }


Justamente esta era la gracia de los `protocols`: declarar un contrato suficiente para aplicar cierto algoritmo que escribimos en algun otro lugar. Sabemos que cualquier tipo que admita el protocolo de polígono tiene un arreglo de vértices. Es información concreta.


    let a: [Polygon] // <- OK

    func doSomething(with polygons: [Polygon]) {
        polygons.forEach {
            eat($0.vertices) // <- Self == Cat
        }
    }


En cambio, un `protocol` con `associatedtype` no es un contrato sino una [plantilla de contrato](http://www.milejemplos.com/contratos/ejemplo-de-contrato-de-compraventa-privado.html). Sabemos qué forma tiene pero no de qué se trata concretamente.

Por ejemplo, podríamos declarar el siguiente `protocol`, que asegura que, quien lo implementa, come algun tipo de cosas:


    protocol Eater {
        associatedtype FoodType
        func eat(food: FoodType)
    }


Como estamos implementando un Sim Farm ®©™ o algo así, definimos:

    struct Beef {}
    struct Lettuce {}

    struct Dog: Eater {
        func eat(food: Beef) {
            print("Guau")
        }
    }

    struct Cat: Eater {
        func eat(food: Beef) {
            print("Miau")
        }
    }

    struct Rabbit: Eater {
        func eat(food: Lettuce) {
            print("...")
        }
    }


Esto permitiría escribir cosas como:


    class Farm {
        var dogs = [Dog]()
        var cats = [Cat]()
        var rabbits = [Rabbit]()

        func feedBeasts() {
            dogs.forEach { $0.eat( Beef() )}
            cats.forEach { $0.eat( Beef() )}
            rabbits.forEach { $0.eat( Lettuce() )}
        }
    }


Pero no algo como:


    class Farm {
        var animals = [Eater]() // <- ERROR

        func feedBeasts() {
            animals.forEach {
                $0.eat( ??? ) // <- ???
            }
        }
    }


¿Qué le daríamos de comer? La única solución posible (suponiendo que compilara), sería castear `$0` y, dependiendo de lo que se trate, se lo alimenta con algo:

    // Este código no compila, no lo intenten en sus casas
    var animals = [Eater]() // <- ERROR

    func feedBeasts() {
        animals.forEach {
            switch $0 {
            case is Dog, is Cat: $0.eat( Beef() )
            case is Rabbit: $0.eat( Lettuce() )
            default: fatalError(":-)")
            }
        }
    }


Ni siquiera podríamos hacer esto, porque no sería posible asegurar que los elementos de la primer colección sean carnívoros y los de la segunda, hervíboros:


        var carnivores = [Eater]() // <- ERROR
        var hervibores = [Eater]() // <- ERROR


Y justamente nos metimos en este mundo de generics y pesadillas para evitar casteos. Y el switch es un if encubierto. No quería decirlo, pero sólo aguanté hasta este párrafo.

Por eso no tendría sentido que compile esa línea. Si es que alguna vez te has preguntado "¿por qué el Xcode es tan cruel?", te digo lo siguiente:

 - el Xcode no tiene la culpa, es sólo el mensajero. La tiene el compilador.
 - lo hace por tu bien: cada vez que casteas tenés una oportunidad menos de programar un sistema que dirija cohetes a la Luna.


{% include figure.html figure="http://placekitten.com/g/230/230" caption="Internet" %}


## ¿Entonces?

Entonces sólo nos queda encontrar una manera de que el delegado sea de un tipo concreto. Recordemos la idea original: tengo estanterías con cosas, me gustaría que el delegado al que se notifica cuando se agregó una cosa no tenga que castear, para tener menos chance de error.


    protocol ShelfDelegate: class {
        associatedtype IType // No "ItemType", para evitar confusiones luego
        func shelf(shelf: Shelf, didStore item: IType)
    }

    class Shelf<ItemType> {
        weak var delegate: ShelfDelegate? // <- ÉSTA
        private (set) var storedItems: [ItemType] = []

        func store(item: ItemType) {
            guard storedItems.count < 2 else { return }

            storedItems.append(item)
            delegate?.shelf(self, didStore: item)
        }
    }


Traigamos a la mente, también, el mensaje de error de la línea señalada:


    "Protocol 'ShelfDelegate' can only be used as a generic constraint because it has Self or associated type requirements"


Si sólo puede ser utilizado como "generic constraint", hagamos eso...


    class AnyShelfDelegate<ItemType> {
        private var _shelf: (Shelf<ItemType>, didStore: ItemType) -> Void

        init<T:ShelfDelegate where T.IType == ItemType>(with theOriginalOne: T) {
            _shelf = theOriginalOne.shelf
        }

        func shelf(shelf: Shelf<ItemType>, didStore item: ItemType) {
            _shelf(shelf, didStore: item)
        }
    }

    class Shelf<ItemType> {
        var delegate: AnyShelfDelegate<ItemType>? // <- NO WEAK!!
        private (set) var storedItems: [ItemType] = []

        func store(item: ItemType) {
            guard storedItems.count < 2 else { return }

            storedItems.append(item)
            delegate?.shelf(self, didStore: item)
        }
    }


No te lo esperabas ¿no? Salió de la galera cual conejos y [palomas](https://youtu.be/mWGEvDbHcDo).

Aclaro que esto no se me ocurrió a mi, no me hago cargo. Al final de esta página podés encontrar enlaces con referencias a otras personas a las que tampoco se les ocurrió, pero tiran enlaces con referencias a otras personas y así.


## ¿Cómo?

Procedamos a destripar la solución.

El `protocol ShelfDelegate` sólo puede ser utilizado como `generic constraint`:


        init<T:ShelfDelegate where ...>(with theOriginalOne: T) {
            ...
        }


El protocolo asegura que quien lo implementa tiene la función `self:didStore:`, y nada más. Entonces eso es lo único que me interesa tener a mano:


        private var _shelf: (Shelf<ItemType>, didStore: ItemType) -> Void

        init<...>(with theOriginalOne: T) {
            _shelf = theOriginalOne.shelf
        }


El `Shelf` ejecutará la función `shelf:didStore` de su delegate cuando se agregue un ítem, y queremos que el verdadero delegate (no el monstruo que hemos creado para evitarnos un simple `if`) se entere:


        func shelf(shelf: Shelf<ItemType>, didStore item: ItemType) {
            _shelf(shelf, didStore: item)
        }


Un `Shelf` que guarde libros sólo podrá tener delegados que entiendan de libros, uno que guarde herramientas, sólo delegados que entiendan de herramientas:


    class AnyShelfDelegate<ItemType> {
        ...
        init<T:ShelfDelegate where T.IType == ItemType>(with theOriginalOne: T) {
            ...
        }
        ...
    }

    class Shelf<ItemType> {
        weak var delegate: AnyShelfDelegate<ItemType>?
        ...
    }


La parte más importante es `T:ShelfDelegate where T.IType == ItemType`. Ahí es donde efectivamente hacemos uso del `associatedtype`.

Notemos que el `Shelf` tiene una referencia fuerte hacia este coso, no es `weak` como cabría esperar de un delegate. Esto se debe a que, si esta referencia fuera débil, entonces en alguna otra parte tendría que haber una referencia fuerte hacia el `AnyShelfDelegate`.

Lo que implica que hay que tener cuidado con las referencias que parten desde `AnyShelfDelegate` hacia cosas de nuestro `delegate` concreto. Como `_shelf`, en este caso.


### Concluyendo

La implementación definitiva de la vista original queda:


    class BookShelfView: UIView {
        var shelf: Shelf<Book> {
            didSet { shelf.delegate = AnyShelfDelegate(with: self) }
        }
    }

    extension BookShelfView: ShelfDelegate {
        func shelf(shelf: Shelf, didStore book: Book) {
            doSomethingRelated(with: book)
        }
    }


La implementación de la granja:


    struct AnyEater<FoodType> {
        private let _eat:(FoodType) -> Void

        init<T: Eater where T.FoodType == FoodType>(with eater: T) {
            _eat = eater.eat
        }

        func eat(food: FoodType) {
            _eat(food)
        }
    }

    class Farm {
        var carnivores = [AnyEater<Beef>]()
        var hervibores = [AnyEater<Lettuce>]()

        func feedBeasts() {
            carnivores.forEach { $0.eat( Beef() ) }
            hervibores.forEach { $0.eat( Lettuce() ) }
        }
    }


    let myFarm = Farm()
    myFarm.carnivores = [
        AnyEater(with: Dog()),
        AnyEater(with: Dog()),
        AnyEater(with: Cat())
    ]
    myFarm.hervibores = [
        AnyEater(with: Rabbit())
    ]


## Conclusiones

Costó, pero eliminamos el `if`.

Estaría bueno encontrar una forma de automatizar todo esto.
Si hubiera macros, podría hacerse algo como:


    struct Any{PROTOCOL_NAME}<GenericType> {
        {FOR EACH PROTOCOL VARIABLE}
            private let _{PROTOCOL_VARIABLE}: {PROTOCOL_VARIABLE_TYPE}
        {END FOR EACH}
        {FOR EACH PROTOCOL_METHOD}
            private let _{PROTOCOL_METHOD}: {PROTOCOL_METHOD_SIGNATURE}
        {END FOR EACH}

        init<T: {PROTOCOL_NAME} where T.{PROTOCOL_ASSOCIATED_TYPE} == GenericType>(with original: T) {
            {FOR EACH PROTOCOL VARIABLE}
                _{PROTOCOL_VARIABLE} = original.{PROTOCOL_VARIABLE}
            {END FOR EACH}
            {FOR EACH PROTOCOL_METHOD}
                _{PROTOCOL_METHOD} = original.{PROTOCOL_METHOD}
            {END FOR EACH}
        }

        // Aquí sólo quiero decir que defino todas las funciones
        // del protocolo original, llamando en cada caso al
        // closure correspondiente.
        {FOR EACH PROTOCOL_METHOD}
            {PROTOCOL_METHOD} {
                _{PROTOCOL_METHOD}()
            }
        {END FOR EACH}
    }


También podría investigarse una forma de manejar los ciclos de referencias, en lugar de pensar en cada caso particular cómo resolverlo, seguramente exista algún patrón.


### Más conclusiones

Lo más difícil no siempre es elegir nombres. A veces cuesta también inventar un ejemplo hipotético para describir algún diseño/loquefuera. ¿Por qué siempre, si no, terminamos con "Hola Mundo", con "Foo/Bar", con "Shape" y "draw", "Animal" y "eat"?

Intenté durante casi diez segundos pensar ejemplos originales, y pensé que el de la granja era bueno hasta que lo ví hace un rato aplicado en LA MISMA situación [acá](http://robnapier.net/erasure). No sé si casualidad o será que ya lo había leído antes.

{% include figure.html figure="http://placekitten.com/g/250/250" caption="struct Cat" %}


# Comentarios

¿Algo de lo que escribí está mal?
¿Algo de lo que escribí puede mejorarse?
¿Se te ocurren mejores ejemplos?
¿Resolviste algo de lo que mencioné en "Conclusiones"?
¿Tenés ganas de insultar a alguien?
¿No te anda el "CTRL+C"?
¿Sentís que estás sólo en el universo?

Podés escribir un comentario y presionar el botón invisible de "Enviar comentario" aquí abajo, o buscar en el sitio, que en algún lugar están mis datos de contacto. No me acuerdo bien dónde.


# Enlaces

 1. [Charla de Gwendolyn Weston ](https://realm.io/news/tryswift-gwendolyn-weston-type-erasure/)
 2. [Charla de Hector Matos](https://realm.io/news/altconf-hector-matos-type-erasure-magic/)
 3. [Google](http://www.google.com)
 4. [Más enlaces otorgan credibilidad](https://youtu.be/oMUqfDlEFlA)
