# Setup Android (AdMob + Push) — pasos post `cap add android`

Esta guía tiene los snippets **exactos** para dejar la app Android lista para
AdMob y notificaciones push. Aplicalos **después** de generar el proyecto nativo.

Datos del proyecto:
- **Package / applicationId:** `com.servimarket.app`
- **Firebase project:** `servimarket-1f980`
- **AdMob App ID:** ⚠️ pendiente — lo obtenés al crear la app en [admob.google.com](https://admob.google.com) (formato `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`, con `~`, NO el ad unit ID que lleva `/`)

---

## 0. Generar el proyecto Android

```bash
npm run build
npx cap add android
npx cap sync
```

Esto crea la carpeta `android/`. Los archivos a editar son:
- `android/app/src/main/AndroidManifest.xml`
- `android/build.gradle` (raíz)
- `android/app/build.gradle`

---

## 1. AndroidManifest.xml

Archivo: `android/app/src/main/AndroidManifest.xml`

### 1a. AdMob App ID — dentro de `<application> ... </application>`

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```
> Reemplazá el valor por tu **App ID de AdMob** (el de `~`). Si lo dejás vacío o mal, la app crashea al iniciar.

### 1b. Permiso de notificaciones (Android 13+) — dentro de `<manifest>`, junto a los otros `uses-permission`

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```
> `INTERNET` ya viene incluido por Capacitor.

---

## 2. Firebase / FCM (para recibir push)

### 2a. Poner el archivo de config
Descargá `google-services.json` desde Firebase Console (app Android `com.servimarket.app`) y copialo en:
```
android/app/google-services.json
```

### 2b. `android/build.gradle` (raíz del proyecto Android) — en `dependencies` de `buildscript`

```gradle
buildscript {
    dependencies {
        // ... otras dependencias
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

### 2c. `android/app/build.gradle` — al FINAL del archivo

```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## 3. Sincronizar y compilar

```bash
npx cap sync android
npm run cap:open:android
```

Desde Android Studio: compilar y correr en un emulador o celular. Al iniciar sesión,
la app pide permiso de notificaciones y registra el token (se guarda en `push_tokens`).

---

## Checklist de verificación

- [ ] `google-services.json` en `android/app/`
- [ ] AdMob `APPLICATION_ID` en el manifest (con `~`)
- [ ] Permiso `POST_NOTIFICATIONS` agregado
- [ ] `google-services` classpath + `apply plugin` en gradle
- [ ] `npx cap sync` corrido después de los cambios
- [ ] App abre sin crashear → registra push token → llega una push de prueba

---

## Notas
- Los **ad unit IDs** (banners) van en `.env` como `VITE_ADMOB_BANNER_ANDROID` (formato con `/`),
  no en el manifest. El manifest solo lleva el **App ID** (con `~`).
- Mientras `VITE_ADMOB_USE_REAL` no sea `true`, la app usa los IDs de test de Google.
- Para iOS el setup es equivalente pero en `Info.plist` (`GADApplicationIdentifier`) + APNs.
