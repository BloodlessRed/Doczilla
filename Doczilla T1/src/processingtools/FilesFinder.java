package processingtools;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface FilesFinder {
    List<Path> findTextFiles(Path rootDir) throws IOException;
}
