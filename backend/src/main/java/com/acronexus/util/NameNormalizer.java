package com.acronexus.util;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class NameNormalizer {

    private static final Set<String> TITLES = Set.of(
            "prof", "professor", "dr", "doctor", "mr", "mrs", "ms", "miss", "er", "engr"
    );

    /**
     * Normalizes a name by removing titles, punctuation, and extra spaces.
     */
    public static String normalize(String name) {
        if (name == null || name.isBlank()) return "";
        
        // Convert to lowercase
        String lower = name.toLowerCase();
        
        // Remove punctuation (dots, hyphens, commas, etc)
        lower = lower.replaceAll("[\\p{Punct}]", " ");
        
        // Split into tokens
        String[] tokens = lower.split("\\s+");
        
        // Filter out titles and empty tokens
        String filtered = Arrays.stream(tokens)
                .filter(t -> !t.isBlank())
                .filter(t -> !TITLES.contains(t))
                .collect(Collectors.joining(" "));
                
        return filtered.trim();
    }

    /**
     * Checks if the extracted name fuzzy-matches the database name.
     * Extracts tokens and checks for intersection. Also supports initials.
     */
    public static boolean fuzzyMatch(String extracted, String dbName) {
        String normExt = normalize(extracted);
        String normDb = normalize(dbName);
        
        if (normExt.isEmpty() || normDb.isEmpty()) return false;
        
        if (normExt.equals(normDb)) return true;
        
        // OCR/PDF spacing error check (e.g. "an kita agraw al" vs "ankita agrawal")
        if (normExt.replaceAll("\\s+", "").equals(normDb.replaceAll("\\s+", ""))) return true;
        
        // Token overlap
        List<String> extTokens = Arrays.asList(normExt.split("\\s+"));
        List<String> dbTokens = Arrays.asList(normDb.split("\\s+"));
        
        // Check if DB name is a subset of Extracted, or vice versa
        List<String> sigDbTokens = dbTokens.stream().filter(t -> t.length() > 1).collect(Collectors.toList());
        List<String> sigExtTokens = extTokens.stream().filter(t -> t.length() > 1).collect(Collectors.toList());
        
        if (!sigDbTokens.isEmpty() && !sigExtTokens.isEmpty()) {
            boolean extContainsDb = sigDbTokens.stream().allMatch(db -> sigExtTokens.contains(db));
            boolean dbContainsExt = sigExtTokens.stream().allMatch(ext -> sigDbTokens.contains(ext));
            if (extContainsDb || dbContainsExt) return true;
        }

        // Abbreviation matching (e.g. MVy -> Manoj Vyas, or PM -> Priya Mehta, or AA -> Amit Agrawal)
        // If extracted has a single token with length >= 2 and <= 4
        if (extTokens.size() == 1 && extTokens.get(0).length() >= 2) {
            String abbr = extTokens.get(0);
            if (abbr.length() == dbTokens.size()) {
                boolean matchesInitial = true;
                for (int i = 0; i < abbr.length(); i++) {
                    if (abbr.charAt(i) != dbTokens.get(i).charAt(0)) {
                        matchesInitial = false;
                        break;
                    }
                }
                if (matchesInitial) return true;
            }
            
            // Sometimes it's MVy -> Manoj Vyas (M V y -> m v)
            if (abbr.length() == 3 && dbTokens.size() == 2) {
                if (abbr.charAt(0) == dbTokens.get(0).charAt(0) && abbr.charAt(1) == dbTokens.get(1).charAt(0)) {
                     return true; // Simple heuristic for MVy
                }
            }
        }
        
        return normExt.contains(normDb) || normDb.contains(normExt);
    }
}
