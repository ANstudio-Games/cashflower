# Automatic Android releases

The `Android release` workflow runs on pushes to `main`. It reads `expo.version`
and `expo.android.versionCode` from `app.json`, generates the Android project,
builds signed ARM64 and universal APKs, and publishes them with checksums to GitHub Releases.
If a release for that version already exists, the build is skipped.

## One-time setup

In GitHub, open **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Signing key alias |
| `ANDROID_KEY_PASSWORD` | Signing key password |

Use the same keystore as the APKs already distributed to users. A different key
prevents updates over the existing installation. Never commit the keystore or
passwords. Keep a secure backup of the original key.

To encode an existing keystore on Linux:

```sh
base64 -w 0 /path/to/release.keystore
```

On Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\release.keystore'))
```

Copy the output directly into the secret, not into an issue, commit, or chat.
The workflow uses GitHub's built-in token; no personal access token or EAS
account is needed. Repository or organization policy must allow the workflow
to write releases with `contents: write`.

## Publish a new version

1. Increase `expo.version` in `app.json`, for example from `1.7.0` to `1.8.0`.
2. Increase `expo.android.versionCode`, for example from `9` to `10`.
3. Commit the changes and push or merge them into `main`.
4. Watch **Actions → Android release**. After it succeeds, the APK and
   `SHA256SUMS.txt` are available under **Releases → v1.8.0**.

Version names must use `major.minor.patch`. The workflow does not increment
versions or push version changes for you. Keep version codes increasing for
Android updates. The package.json version is not used as the app version.

The native Android folder is generated in CI because it is ignored by Git.
Any required native customization must be represented by app configuration,
config plugins, or a committed build script, not only local Android files.

## APK sizes and architecture support

- `cashflower-VERSION-arm64.apk`: smaller download for ARM64 Android devices.
- `cashflower-VERSION.apk`: universal fallback containing ARM64, ARMv7, x86,
  and x86_64 libraries. The legacy name stays universal so installed versions'
  in-app updater remains compatible with non-ARM64 devices.

Both builds pass `-Pexpo.useLegacyPackaging=true` directly to Gradle to compress
native libraries even after prebuild. CI verifies signatures, expected ABIs,
and native-library compression, and prints actual artifact sizes. Compression
reduces download size, not necessarily installed size. Minification/resource
shrinking remain unchanged pending device regression testing.

Two builds share the generated project and Gradle outputs, but take longer than
one universal build. Actual resulting sizes must be measured in Actions; there
is no fixed size guarantee.

## Failures and retries

Missing secrets, invalid signing credentials, type-check failures, or build
failures stop publication. Inspect the failed step in Actions and rerun the
workflow after fixing it. You can also use **Run workflow** on `main`.

Existing releases are never overwritten. If a release was published with the
wrong APK, publish a corrected version with a higher version code. If uploading
failed partway through creating a release, inspect that release before retrying;
a release already present for the tag will cause the workflow to skip it.

The first successful run may publish the current version if no matching release
exists yet. Builds use GitHub-hosted runners and count toward applicable GitHub
Actions usage limits. Publishing an APK does not verify that every app feature
works; test the APK on a device before sharing it with users.
