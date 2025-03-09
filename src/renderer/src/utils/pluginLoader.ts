export async function LoadingPluginOfficial() {
    const pluginFiles = ['test1', "test2"];
    const loadedPlugins: { main: () => Promise<void>, information: { version: string, name: string } }[] = [];
    for (const file of pluginFiles) {
      const plugin = await import(`../../plugins/${file}.tsx`);
      loadedPlugins.push({ main: plugin.default, information: plugin.information() });
      plugin.default()
    }
} 