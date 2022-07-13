install_dir=~/.local/share/applications
name=vector.desktop
desktop=$(xdg-user-dir DESKTOP)

question() {
    echo -n "$1 [Y/N] "
    read response
    return $([ ${response,,} == "y" ])
}

echo "Checking if vector is installed... "
if ! [ -f $install_dir/$name ]; then
    echo "Vector is not installed. Aborting..."
    exit 1
fi

if ! question "Vector will now be uninstalled. Continue?"; then
    echo "Aborting..."
    exit 1
fi

rm $install_dir/$name
echo "Done!"
if [ -f $desktop/$name ]; then
    if question "There's a shortcut to vector in your desktop. Do you wish to remove that too?"; then
        rm $desktop/$name
        echo "Done!"
    fi
fi

