executable="vector"
icon="resources/app/icono.png"
install_dir=~/.local/share/applications
files="$executable $icon"
name=vector.desktop
echo "Checking for the necessary files..."

for file in $files; do
    if [ -f $file ]; then
        echo "$file found."
    else
        echo "$file does not exist. Aborting..."
        exit 1
    fi
done

question() {
    echo -n "$1 [Y/N] "
    read response
    return $([ ${response,,} == "y" ])
}

if ! question "Vector will be installed on $install_dir. Continue?"; then
    echo "Aborting..."
    exit
fi

echo "Installing..."
echo "[Desktop Entry]
Comment=A free and open source drawing program.
Comment[es]=Un programa de dibujo gratis y código libre.
Exec=$PWD/$executable
GenericName[es]=Un programa de dibujo gratis y código libre.
GenericName=A free and open source drawing program.
Icon=$PWD/$icon
Name=Papa productions Vector
StartupNotify=true
Terminal=false
TerminalOptions=
Type=Application
X-DBUS-ServiceName=
X-DBUS-StartupType=
X-KDE-SubstituteUID=false
X-KDE-Username=
Categories=Graphics;2DGraphics;VectorGraphics;" > $install_dir/$name

if question "Done! Do you wish to add a shortcut on your desktop?"; then
    cp $install_dir/$name $(xdg-user-dir DESKTOP)/$name
    echo "Done! Note that it may appear with an exclamation sign. This is a sign that the app isn't trusted (because it hasn't been opened yet). It'll dissapear once you run the app."
fi
