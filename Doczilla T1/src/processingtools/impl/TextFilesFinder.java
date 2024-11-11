package processingtools.impl;

import processingtools.FilesFinder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

public class TextFilesFinder implements FilesFinder {
    @Override
    public List<Path> findTextFiles(Path rootDir) throws IOException {
        return Files.walk(rootDir)
                .filter(Files::isRegularFile)
                .filter(path -> path.toString().endsWith(".txt"))
                .sorted()
                .collect(Collectors.toList());
    }
}
