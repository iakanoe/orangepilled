cambiar TODO el código a inglés. usar la palabra "domain" para "patente". el contenido y todo debería estar en español pero el código y el schema en general quedó en un spanglish raro que no me gusta. todo inglés. rutas también eh.
mover TODOS los copies a algun CMS o al menos algun archivo separado para poder cambiarlos de manera centralizada (y para futura localización?)
mover TODAS las constantes tipo umbrales de cantidades de incidentes, ventanas de días, etc a algun CMS o al menos a algun archivo separado para poder cambiarlos de manera centralizada.
el tema del caché local está bueno para hacer la app parecer que anda más rápido, pero hace que cuando haya una actualización de los datos, no se refleje inmediatamente. por ejemplo, en la página de consultar patentes, cuando consultás una patente, después vas y reportás un incidente para la patente, y volvés a consultarla, el incidente nuevo no aparece y es probablemente porque está cacheado. no sé si haría falta sacar el caché de esa página y quizás alguna otra también
quiero agregar un prompt para instalar la app en la zona de configuración. y sacar toda la parte de notificaciones hasta que la app no esté instalada.
quiero que al instalar la PWA se abra directamente la app como PWA o al menos que se deje un cartel explicando cómo hacerlo.
quiero convertir al proyecto en una app mobile con react native, aparte de la PWA.
en la PWA en android el color de la status bar se me pone azul y no naranja como el branding... arreglar.
quiero cambiar toda la UI para que sea menos AI-coded
