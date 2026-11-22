----------------------- MODULE RuntimeGeneration -----------------------
EXTENDS TLC

CONSTANTS EarlyPublish, ReReadDetails
ASSUME /\ EarlyPublish \in BOOLEAN
       /\ ReReadDetails \in BOOLEAN

VARIABLES stage, installed, switched, manifest, clientPin, clientCore, clientDetails
vars == <<stage, installed, switched, manifest, clientPin, clientCore, clientDetails>>

Init ==
  /\ stage = "start"
  /\ installed = {"old"}
  /\ switched = FALSE
  /\ manifest = "old"
  /\ clientPin = "none"
  /\ clientCore = "none"
  /\ clientDetails = "none"

StageCore ==
  /\ stage = "start"
  /\ stage' = "core"
  /\ UNCHANGED <<installed, switched, manifest, clientPin, clientCore, clientDetails>>

StageDetails ==
  /\ stage = "core"
  /\ stage' = "both"
  /\ UNCHANGED <<installed, switched, manifest, clientPin, clientCore, clientDetails>>

InstallGeneration ==
  /\ stage = "both"
  /\ "new" \notin installed
  /\ installed' = installed \cup {"new"}
  /\ UNCHANGED <<stage, switched, manifest, clientPin, clientCore, clientDetails>>

SwitchManifest ==
  /\ ~switched
  /\ (IF EarlyPublish THEN stage = "core" ELSE "new" \in installed)
  /\ switched' = TRUE
  /\ manifest' = "new"
  /\ UNCHANGED <<stage, installed, clientPin, clientCore, clientDetails>>

PinManifest ==
  /\ clientPin = "none"
  /\ clientPin' = manifest
  /\ UNCHANGED <<stage, installed, switched, manifest, clientCore, clientDetails>>

ReadCore ==
  /\ clientPin # "none"
  /\ clientCore = "none"
  /\ clientPin \in installed
  /\ clientCore' = clientPin
  /\ UNCHANGED <<stage, installed, switched, manifest, clientPin, clientDetails>>

ReadDetails ==
  /\ clientPin # "none"
  /\ clientDetails = "none"
  /\ LET target == IF ReReadDetails THEN manifest ELSE clientPin
     IN /\ target \in installed
        /\ clientDetails' = target
  /\ UNCHANGED <<stage, installed, switched, manifest, clientPin, clientCore>>

Next == StageCore \/ StageDetails \/ InstallGeneration \/ SwitchManifest
     \/ PinManifest \/ ReadCore \/ ReadDetails

Spec == Init /\ [][Next]_vars

TypeOK ==
  /\ stage \in {"start", "core", "both"}
  /\ installed \subseteq {"old", "new"}
  /\ switched \in BOOLEAN
  /\ manifest \in {"old", "new"}
  /\ clientPin \in {"none", "old", "new"}
  /\ clientCore \in {"none", "old", "new"}
  /\ clientDetails \in {"none", "old", "new"}

ManifestReady == manifest \in installed
ClientConsistent == clientCore = "none" \/ clientDetails = "none" \/ clientCore = clientDetails
========================================================================
