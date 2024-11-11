package processingtools;

import processingtools.entities.TextFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface FileParser {
    TextFile parseFile(Path filePath) throws IOException;
}
