package processingtools.exceptions;

import java.util.List;

public class CyclicDependencyException extends Exception {
    private final List<String> cycle;

    public CyclicDependencyException(List<String> cycle) {
        super("Detected cyclic dependency: " + String.join(" -> ", cycle));
        this.cycle = cycle;
    }

    public List<String> getCycle() {
        return cycle;
    }
}
