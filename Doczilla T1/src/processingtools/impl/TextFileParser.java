package processingtools.impl;

import processingtools.FileParser;
import processingtools.entities.TextFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TextFileParser implements FileParser {

    private static final Pattern REQUIRE_PATTERN = Pattern.compile("require ‘([^']*)’");

    @Override
    public TextFile parseFile(Path filePath) throws IOException {
        String content;
        try (BufferedReader reader = Files.newBufferedReader(filePath, StandardCharsets.UTF_8)) {
            StringBuilder contentBuilder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                contentBuilder.append(line).append(System.lineSeparator());
            }
            content = contentBuilder.toString();
        }

        Set<String> dependencies = new HashSet<>();

        String[] lines = content.split(System.lineSeparator());

        for (String line : lines) {
            Matcher matcher = REQUIRE_PATTERN.matcher(line);
            while (matcher.find()) {
                String dependency = matcher.group(1).trim();
                dependency = dependency.replace('/', File.separatorChar)
                        .replace('\\', File.separatorChar);
                dependencies.add(dependency);
            }
        }

        return new TextFile(filePath, dependencies, content);
    }
}
