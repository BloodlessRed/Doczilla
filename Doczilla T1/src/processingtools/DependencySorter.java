package processingtools;

import processingtools.entities.TextFile;
import processingtools.exceptions.CyclicDependencyException;

import java.util.List;

public interface DependencySorter {
    List<TextFile> sortByDependencies(List<TextFile> files) throws CyclicDependencyException;
}
