package processingtools.impl;

import processingtools.DependencySorter;
import processingtools.entities.TextFile;
import processingtools.exceptions.CyclicDependencyException;

import java.util.*;
import java.util.stream.Collectors;

public class TopologicalDependencySorter implements DependencySorter {
    @Override
    public List<TextFile> sortByDependencies(List<TextFile> files) throws CyclicDependencyException {
        Map<String, TextFile> fileMap = files.stream()
                .collect(Collectors.toMap(
                        file -> file.getPath().toString(),
                        file -> file
                ));

        // Строим граф зависимостей и подсчитываем входящие рёбра
        Map<String, Set<String>> graph = new HashMap<>();
        Map<String, Set<String>> reverseGraph = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        // Инициализация графов и подсчет входящих рёбер
        for (TextFile file : files) {
            String filePath = file.getPath().toString();
            graph.put(filePath, new HashSet<>(file.getDependencies()));
            inDegree.put(filePath, 0);
            reverseGraph.put(filePath, new HashSet<>());
        }

        for (Map.Entry<String, Set<String>> entry : graph.entrySet()) {
            String file = entry.getKey();
            for (String dependency : entry.getValue()) {
                String dependencyFile = reverseGraph.keySet().stream()
                        .filter(path -> path.contains(dependency))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException(
                                String.format("Missing required file: %s (referenced in %s)", dependency, file)
                        ));

                reverseGraph.get(dependencyFile).add(file);
                inDegree.merge(file, 1, Integer::sum);
            }
        }

        checkForCycles(graph);

        List<String> sorted = sortWithPriorityQueue(reverseGraph, inDegree);

        if (sorted.size() != files.size()) {
            throw new IllegalStateException("Unable to sort all files. Possible undetected cyclic dependency.");
        }

        return sorted.stream()
                .map(fileMap::get)
                .collect(Collectors.toList());
    }

    private List<String> sortWithPriorityQueue(
            Map<String, Set<String>> reverseGraph,
            Map<String, Integer> inDegree) {

        PriorityQueue<String> queue = new PriorityQueue<>(Comparator.comparingInt((String a) -> reverseGraph.get(a).size()).thenComparing(a -> a));

        inDegree.forEach((file, degree) -> {
            if (degree == 0) queue.offer(file);
        });

        List<String> result = new ArrayList<>();
        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);

            new ArrayList<>(reverseGraph.get(current)).forEach(dependent -> {
                inDegree.merge(dependent, -1, Integer::sum);
                if (inDegree.get(dependent) == 0) {
                    queue.offer(dependent);
                }
            });
        }

        return result;
    }

    private void checkForCycles(Map<String, Set<String>> graph) throws CyclicDependencyException {
        List<String> files = new ArrayList<>(graph.keySet());

        for (int i = 0; i < files.size(); i++) {
            String file1 = files.get(i);
            Set<String> dependencies1 = graph.get(file1);

            for (int j = i + 1; j < files.size(); j++) {
                String file2 = files.get(j);
                Set<String> dependencies2 = graph.get(file2);

                boolean file1DependsOnFile2 = dependencies1.stream()
                        .anyMatch(file2::contains);

                boolean file2DependsOnFile1 = dependencies2.stream()
                        .anyMatch(file1::contains);

                if (file1DependsOnFile2 && file2DependsOnFile1) {
                    List<String> cycle = Arrays.asList(file1, file2);
                    throw new CyclicDependencyException(cycle);
                }
            }
        }
    }
}