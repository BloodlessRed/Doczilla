import processingtools.impl.TextFileParser;
import processingtools.impl.TextFilesFinder;
import processingtools.impl.TopologicalDependencySorter;

import java.nio.file.Path;
import java.nio.file.Paths;

public class Application {
    public static void main(String[] args) {
        if (args.length > 2){
            System.out.println("Передайте только пути к папке с файлами и выходному файлу !");
            return;
        }
        Path rootDir = Paths.get(args[0]);
        Path outputFile = Paths.get(args[1]);

        FileProcessor processor = new FileProcessor(
                new TextFilesFinder(),
                new TextFileParser(),
                new TopologicalDependencySorter()
        );

        processor.processFiles(rootDir, outputFile);
    }
}
