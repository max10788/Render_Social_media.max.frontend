from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def split_data(data, labels, test_size=0.3, val_size=0.5, random_state=42):
    """
    Teilt die Daten in Trainings-, Validierungs- und Testdaten auf.
    
    Args:
        data: Die Eingabedaten (z. B. Tweets oder On-Chain-Daten).
        labels: Die Zielvariablen (z. B. Wallet-Zuordnung).
        test_size: Anteil der Testdaten (Standard: 0.3).
        val_size: Anteil der Validierungsdaten aus dem temporären Datensatz (Standard: 0.5).
        random_state: Seed für die Reproduzierbarkeit (Standard: 42).
    
    Returns:
        X_train, X_val, X_test, y_train, y_val, y_test
    """
    if len(data) != len(labels):
        raise ValueError("Die Länge von 'data' und 'labels' muss übereinstimmen.")
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        data, labels, test_size=test_size, random_state=random_state
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=val_size, random_state=random_state
    )
    return X_train, X_val, X_test, y_train, y_val, y_test

def evaluate_model(model, X_test, y_test):
    """
    Evaluieren Sie das Modell und geben Sie eine Klassifikationsübersicht aus.
    
    Args:
        model: Das trainierte Machine-Learning-Modell.
        X_test: Die Testdaten.
        y_test: Die Testlabels.
    
    Returns:
        dict: Ein Wörterbuch mit den Metriken aus dem Klassifikationsbericht.
    """
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    print(classification_report(y_test, y_pred))
    return report

def analyze_errors(model, X_test, y_test, max_errors=None):
    """
    Analysieren Sie falsch klassifizierte Beispiele.
    
    Args:
        model: Das trainierte Machine-Learning-Modell.
        X_test: Die Testdaten.
        y_test: Die Testlabels.
        max_errors: Maximale Anzahl der zurückgegebenen Fehler (optional).
    
    Returns:
        list: Eine Liste von Tupeln mit (Input, True-Label, Predicted-Label).
    """
    y_pred = model.predict(X_test)
    errors = [
        (X_test[i], y_test[i], y_pred[i])
        for i in range(len(y_test))
        if y_test[i] != y_pred[i]
    ]
    if max_errors is not None:
        errors = errors[:max_errors]
    return errors
