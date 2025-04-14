from sklearn.model_selection import train_test_split

def split_data(features, labels, test_size=0.3, val_size=0.5, random_state=42):
    """
    Teilt die Daten in Trainings-, Validierungs- und Testdaten auf.
    
    Args:
        features: Die kombinierten Features.
        labels: Die Zielvariablen (z. B. Korrelation zwischen Tweets und Transaktionen).
        test_size: Anteil der Testdaten (Standard: 0.3).
        val_size: Anteil der Validierungsdaten aus dem temporären Datensatz (Standard: 0.5).
        random_state: Seed für die Reproduzierbarkeit (Standard: 42).
    
    Returns:
        tuple: X_train, X_val, X_test, y_train, y_val, y_test
    """
    X_train, X_temp, y_train, y_temp = train_test_split(
        features, labels, test_size=test_size, random_state=random_state
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=val_size, random_state=random_state
    )
    return X_train, X_val, X_test, y_train, y_val, y_test
