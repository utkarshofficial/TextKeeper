import React from "react";
import DataList from "./comonents/DataList";
import Paste from "./comonents/Paste";
import ShowToast from "./comonents/ShowToast";
import Register from "./comonents/Register";
import Login from "./comonents/Login";
import { AuthProvider } from "./Auth";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { getDatabase, ref, onValue, set } from "firebase/database";
import "./firebase";

function App() {
  // firebase functions
  // for adding the dataarray to the firebase db
  const addDataFire = (newDataList) => {
    // for removing the example data
    if (newDataList.indexOf("example") !== -1 && newDataList.length > 1) {
      newDataList.splice(newDataList.indexOf("example"),1);
    }
    setDataList(newDataList);
    const db = getDatabase();
    set(ref(db, "paste-data"), {
      data: [...newDataList],
    });
  };
  // for reading data from the firebase db
  const readDataFire = () => {
    const db = getDatabase();
    const dbref = ref(db, "paste-data/data");
    // snapshot carries all the data of firebase db
    onValue(dbref, (snapshot) => {
      let records = [];
      snapshot.forEach((childSnapshot) => {
        let data = childSnapshot.val();
        records.push(data);
      });
      if(snapshot.size === 0){
        addDataFire(["example"]);
        return;
      }
      setDataList(records);
    });
  };
  // for checking data list is readed or not
  const [isDataListed,setIsDataListed] = React.useState(false);
  // firebase functions end ------------- //
  const [dataList, setDataList] = React.useState([]);
  // condition for redering list
  if (!isDataListed) {
    readDataFire();
    // if (dataList.length === 0) {
    //   let newData = ["example"];
    //   addDataFire(newData);
    // }
    setIsDataListed(true);
  }
  // for toast message copy or deleted
  const [severity, setSeverity] = React.useState("success");

  // copy the data to clipboard and show toast
  const [copied, setCopied] = React.useState(false);

  // saved removed data for undo it
  const [undoData, setUndoData] = React.useState("");

  const removeDataItem = (index) => {
    let newDataList = [...dataList];
    setUndoData(newDataList.splice(index, 1).toString());
    addDataFire(newDataList);
    setSeverity("error");
    showToast();
  };

  const undo = () => {
    let newDataList = [...dataList];
    newDataList.unshift(undoData);
    addDataFire(newDataList);
    hideToast();
  };

  const pasteDataItem = (pasteItem) => {
    let newDataList = [...dataList];

    // pasted manually
    if (!navigator.clipboard && pasteItem !== "") {
      let availIndex = newDataList.indexOf(pasteItem);
      if (availIndex !== -1) {
        let availableData = newDataList.splice(availIndex, 1).toString();
        newDataList.unshift(availableData);
        addDataFire(newDataList);
        return;
      }
      // if not available then simply add it
      newDataList.unshift(pasteItem);
      addDataFire(newDataList);
    } else {
      // paste by button
      navigator.clipboard.readText().then((text) => {
        // checking that if data already available
        // then don't add just remove and add again
        let availIndex = newDataList.indexOf(text);
        if (availIndex !== -1) {
          let availableData = newDataList.splice(availIndex, 1).toString();
          newDataList.unshift(availableData);
          addDataFire(newDataList);
          return;
        }
        // if not available then simply add it
        newDataList.unshift(text);
        addDataFire(newDataList);
      });
    }
  };

  const showToast = () => {
    setCopied(true);
  };

  const hideToast = () => {
    setSeverity("success");
    setCopied(false);
  };

  const Home = (
    <div className="box">
      <Paste pasteDataItem={pasteDataItem} />
      <DataList
        dataList={dataList}
        removeDataItem={removeDataItem}
        showToast={showToast}
      />
      {copied ? (
        <ShowToast severity={severity} hideToast={hideToast} undo={undo} />
      ) : null}
    </div>
  );

  return (
      <Router>
        <Routes>
          <Route exact path="/">
            <Route index element={Home}/>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Register />} />
          </Route>
        </Routes>
      </Router>
  );
}

export default App;
