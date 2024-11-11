package processingtools.entities;

import java.nio.file.Path;
import java.util.Set;

public class TextFile {
    private final Path path;
    private final Set<String> dependencies;
    private final String content;

    public TextFile(Path path, Set<String> dependencies, String content) {
        this.path = path;
        this.dependencies = dependencies;
        this.content = content;
    }

    public Path getPath() { return path; }
    public Set<String> getDependencies() { return dependencies; }
    public String getContent() { return content; }
}
