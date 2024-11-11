import processingtools.DependencySorter;
import processingtools.FileParser;
import processingtools.FilesFinder;
import processingtools.entities.TextFile;
import processingtools.exceptions.CyclicDependencyException;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

public class FileProcessor {
    private final FilesFinder filesFinder;
    private final FileParser fileParser;
    private final DependencySorter dependencySorter;

    public FileProcessor(FilesFinder filesFinder, FileParser fileParser, DependencySorter dependencySorter) {
        this.filesFinder = filesFinder;
        this.fileParser = fileParser;
        this.dependencySorter = dependencySorter;
    }
    public void processFiles(Path rootDir, Path outputFile) {
        try {
            List<Path> textFiles = filesFinder.findTextFiles(rootDir);

            List<TextFile> parsedFiles = textFiles.stream()
                    .map(path -> {
                        try {
                            return fileParser.parseFile(path);
                        } catch (IOException e) {
                            throw new UncheckedIOException(e);
                        }
                    })
                    .collect(Collectors.toList());

            List<TextFile> sortedFiles = dependencySorter.sortByDependencies(parsedFiles);

            try (BufferedWriter writer = Files.newBufferedWriter(outputFile)) {
                for (TextFile file : sortedFiles) {
                    writer.write(file.getContent());
                    writer.newLine();
                }
            }

        } catch (CyclicDependencyException e) {
            System.err.println("Error: Cyclic dependency detected!");
            System.err.println("Cycle: " + String.join(" -> ", e.getCycle()));
        } catch (IOException e) {
            System.err.println("Error processing files: " + e.getMessage());
        }
    }
}
