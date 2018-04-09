#!/bin/sh
set -e

TRUNK_BRANCH="master"

RELEASES_DIR="./releases"

PKG_NAME=$(jq -r .name package.json)
OLD_VERSION=$(jq -r .version package.json)

SEMVER_REGEX="\([0-9]*\)[.]\([0-9]*\)[.]\([0-9]*\)"

MAJOR=$(echo $OLD_VERSION | sed -e "s/$SEMVER_REGEX/\1/")
MINOR=$(echo $OLD_VERSION | sed -e "s/$SEMVER_REGEX/\2/")
PATCH=$(echo $OLD_VERSION | sed -e "s/$SEMVER_REGEX/\3/")

case "$1" in
    "patch")
        PATCH=$(($PATCH + 1))
        ;;
    "minor")
        MINOR=$(($MINOR + 1))
        PATCH=0
        ;;
    "major")
        MAJOR=$(($MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    *)
        echo "First argument must be version level (major|minor|patch)."
        return 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "Changing version $OLD_VERSION -> $NEW_VERSION"

VERSION_DIR="$PKG_NAME-v$NEW_VERSION"
TARGET_DIR="$RELEASES_DIR/$VERSION_DIR"

# checks
if [ $(git rev-parse --abbrev-ref HEAD) != "$TRUNK_BRANCH" ]; then
    echo "Not on trunk branch '$TRUNK_BRANCH'"
    return 1
elif ! git diff --quiet HEAD -- package.json; then
    echo "You have uncommitted changes in package.json."
    return 1
elif [ -d "$TARGET_DIR" ]; then
    return 1
    echo "Target directory exists: $TARGET_DIR"
    return 1
elif ! yarn lint; then
    echo "Linting failed"
    return 1
fi

echo "Updating package.json..."
sed -i "s/\([\"']version[\"']:\s*[\"']\)\($OLD_VERSION\)\([\"']\)/\1$NEW_VERSION\3/" package.json

echo "Committing..."
git commit -n package.json -m"v$OLD_VERSION -> v$NEW_VERSION"
git tag "v$NEW_VERSION"

echo "Building production assets..."
yarn dist

echo "Copying assets..."
mkdir -pv "$TARGET_DIR/scripts"
cp -rv build/*.min.js "$TARGET_DIR/scripts"
cp -rv config.js css img localization examples package.json README.md "$TARGET_DIR"

echo "Converting index.html..."
cat "index.html" | while read line; do
    if [ "$line" = '<script async src="build/core.js"></script>' ]; then
        echo "<script>"
        cat "src/_asset_loader.js"
        echo "</script>"
    else
        echo "$line"
    fi
done > "$TARGET_DIR/index.html"

echo "Creating archives..."
cd "$RELEASES_DIR"
zip -r "$VERSION_DIR.zip" "$VERSION_DIR"

