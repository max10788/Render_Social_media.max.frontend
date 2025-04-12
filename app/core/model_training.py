from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def split_data(data, labels, test_size=0.3, val_size=0.5, random_state=42):
    X_train, X_temp, y_train, y_temp = train_test_split(
        data, labels, test_size=test_size, random_state=random_state
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=val_size, random_state=random_state
    )
    return X_train, X_val, X_test, y_train, y_val, y_test

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))

def analyze_errors(model, X_test, y_test):
    y_pred = model.predict(X_test)
    errors = [(X_test[i], y_test[i], y_pred[i]) for i in range(len(y_test)) if y_test[i] != y_pred[i]]
    return errors
