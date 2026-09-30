import java.nio.charset.Charset;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.TimeZone;
import java.util.TreeMap;

public class BrowserJavaExplorer {
    private static final String[] ENVIRONMENT_NAMES = {
            "JAVA_HOME", "JRE_HOME", "JDK_HOME", "JAVA_VERSION",
            "JDK_JAVA_OPTIONS", "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS", "JAVA_OPTS",
            "CLASSPATH", "PATH", "OS", "OS_VERSION", "OSTYPE", "HOSTTYPE",
            "MACHTYPE", "PROCESSOR_ARCHITECTURE", "PROCESSOR_ARCHITEW6432",
            "PROCESSOR_IDENTIFIER", "PROCESSOR_LEVEL"
    };

    private interface Reading {
        String get() throws Exception;
    }

    public static void main(String[] args) {
        System.out.println("JAVA IN THIS BROWSER");
        System.out.println("====================");
        System.out.println("Source compiled and executed here with TeaVM.\n");

        printProperties();
        printEnvironment();
        printRuntimeReadings();
        printPrimeSurvey();
        printMandelbrot();
    }

    private static void section(String title) {
        System.out.println("\n" + title);
        System.out.println(rule(title.length()));
    }

    private static String rule(int length) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < length; i++) line.append('-');
        return line.toString();
    }

    private static boolean relevantProperty(String key) {
        String name = key.toLowerCase(Locale.ROOT);
        return name.startsWith("java.") || name.startsWith("jdk.")
                || name.startsWith("os.") || name.startsWith("sun.")
                || name.startsWith("user.") || name.contains("java_home")
                || name.contains("jdk") || name.contains("os_version")
                || name.contains("ostype") || name.contains("arch");
    }

    private static void printProperties() {
        section("Java and OS system properties");
        try {
            Properties properties = System.getProperties();
            Map<String, String> selected = new TreeMap<>();
            for (String key : properties.stringPropertyNames()) {
                if (relevantProperty(key)) {
                    selected.put(key, properties.getProperty(key));
                }
            }
            if (selected.isEmpty()) {
                System.out.println("  (none)");
                return;
            }
            selected.forEach((key, value) ->
                    System.out.println("  " + key + " = " + value));
            System.out.println("  " + selected.size() + " matching properties");
        } catch (Throwable error) {
            System.out.println("  unavailable: " + error);
        }
    }

    private static void printEnvironment() {
        section("Java and OS environment variables");
        int found = 0;
        for (String name : ENVIRONMENT_NAMES) {
            try {
                String value = System.getenv(name);
                if (value != null) {
                    System.out.println("  " + name + " = " + value);
                    found++;
                }
            } catch (Throwable error) {
                System.out.println("  " + name + " unavailable: " + error);
            }
        }
        if (found == 0) System.out.println("  (none of the selected names)");
    }

    private static void reading(String label, Reading value) {
        try {
            System.out.println("  " + label + " = " + value.get());
        } catch (Throwable error) {
            System.out.println("  " + label + " = unavailable (" + error + ")");
        }
    }

    private static void printRuntimeReadings() {
        section("Live runtime readings");
        reading("logical processors", () -> "" + Runtime.getRuntime().availableProcessors());
        reading("default locale", () -> Locale.getDefault().toLanguageTag());
        reading("time zone", () -> TimeZone.getDefault().getID());
        reading("default charset", () -> Charset.defaultCharset().name());
        reading("epoch milliseconds", () -> "" + System.currentTimeMillis());
        reading("PI as IEEE-754 bits", () ->
                Long.toHexString(Double.doubleToLongBits(Math.PI)));
    }

    private static void printPrimeSurvey() {
        section("A little real Java work: primes below 10,000");
        int limit = 10_000;
        boolean[] composite = new boolean[limit];
        for (int candidate = 2; candidate * candidate < limit; candidate++) {
            if (!composite[candidate]) {
                for (int multiple = candidate * candidate; multiple < limit;
                        multiple += candidate) {
                    composite[multiple] = true;
                }
            }
        }

        int count = 0;
        int largest = 0;
        long sum = 0;
        int[] perThousand = new int[10];
        for (int number = 2; number < limit; number++) {
            if (!composite[number]) {
                count++;
                largest = number;
                sum += number;
                perThousand[number / 1000]++;
            }
        }

        System.out.println("  primes found = " + count);
        System.out.println("  largest = " + largest);
        System.out.println("  sum = " + sum);
        System.out.println("  distribution by thousand:");
        for (int bucket = 0; bucket < perThousand.length; bucket++) {
            StringBuilder bar = new StringBuilder();
            for (int mark = 0; mark < perThousand[bucket] / 8; mark++) {
                bar.append('#');
            }
            int from = bucket * 1000;
            int through = from + 999;
            System.out.println("  " + from + "-" + through + "  "
                    + bar + " (" + perThousand[bucket] + ")");
        }
    }

    private static void printMandelbrot() {
        section("A tiny Mandelbrot set, calculated in Java");
        int width = 62;
        int height = 19;
        int maxIterations = 48;
        String shades = " .:-=+*#%";

        for (int row = 0; row < height; row++) {
            StringBuilder picture = new StringBuilder("  ");
            double imaginary = 1.15 - 2.30 * row / (height - 1);
            for (int column = 0; column < width; column++) {
                double real = -2.25 + 3.20 * column / (width - 1);
                double x = 0;
                double y = 0;
                int iterations = 0;
                while (x * x + y * y <= 4 && iterations < maxIterations) {
                    double nextX = x * x - y * y + real;
                    y = 2 * x * y + imaginary;
                    x = nextX;
                    iterations++;
                }
                if (iterations == maxIterations) {
                    picture.append('@');
                } else {
                    int shade = Math.min(shades.length() - 1, iterations / 5);
                    picture.append(shades.charAt(shade));
                }
            }
            System.out.println(picture);
        }
        System.out.println("  @ marks points that stayed bounded for 48 iterations.");
    }
}
